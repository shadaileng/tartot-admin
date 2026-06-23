# Admin 登录体系 — 实现方案

> 版本：v1.0 | 最后更新：2026-06-24 | 状态：规划中

## §0 背景

当前 Admin 后台认证使用**单一 API Key** 方式：

- 后端环境变量 `API_KEY` 配置一个固定值
- 所有管理员共享同一个 key
- 无法区分"是哪个管理员在操作"
- 无法实现权限分级（只看日志 vs 修改配置）

团队扩大后需要：
- 每个管理员独立账号
- 密码登录
- 审计追踪（谁在什么时候做了什么）

---

## §1 目标

建立独立的 **Admin 管理员身份体系**，逐步替换 API_KEY 认证：

| | 当前 (API_KEY) | 目标 (Admin JWT) |
|:---|:---|:---|
| 身份存储 | 环境变量 | `admins` 表 |
| 认证方式 | 比对字符串 | bcrypt 密码 + JWT |
| 多人支持 | ❌ 共享同一 key | ✅ 每人独立账号 |
| 操作审计 | ❌ 无法追踪 | ✅ 记录操作用户 |
| 权限分级 | ❌ 全有或全无 | ✅ 可扩展（admin / readonly） |

---

## §2 数据库

### 2.1 新增 `admins` 表

```sql
CREATE TABLE admins (
  id           TEXT PRIMARY KEY,       -- UUID
  username     TEXT NOT NULL UNIQUE,   -- 登录用户名
  password_hash TEXT NOT NULL,         -- bcrypt 哈希
  display_name TEXT NOT NULL DEFAULT '', -- 显示名称
  role         TEXT NOT NULL DEFAULT 'admin',  -- 'admin' | 'readonly'
  created_at   TEXT NOT NULL,
  last_login_at TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1  -- 0 = 禁用
);

CREATE UNIQUE INDEX idx_admins_username ON admins(username);
```

### 2.2 初始化管理员

```sql
-- 首次部署时，通过脚本创建初始管理员
-- 密码哈希由后端接口生成
INSERT INTO admins (id, username, password_hash, display_name, role, created_at, is_active)
VALUES (?, ?, ?, '超级管理员', 'admin', datetime('now'), 1);
```

或者在后端启动时自动检测：如果 `admins` 表为空且环境变量 `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD` 已设置，则自动创建初始管理员。

---

## §3 后端

### 3.1 认证接口

#### 3.1.1 `POST /admin/auth/login`（公开）

```typescript
// 请求体
{
  "username": "admin",
  "password": "mypassword"
}

// 成功响应
{
  "token": "eyJ...",           // Admin JWT（有效期 24h）
  "admin": {
    "id": "uuid",
    "username": "admin",
    "displayName": "超级管理员",
    "role": "admin"
  }
}

// 失败响应
{ "error": "INVALID_CREDENTIALS", "message": "用户名或密码错误" }
```

实现要点：
- 查 `admins` 表按 `username` 查找 + 校验 `is_active = 1`
- 用 `bcrypt.compare` 验证密码
- JWT payload：`{ sub: admin.id, username, role, type: 'admin' }`
- JWT 有效期 24 小时（可配置 `ADMIN_JWT_EXPIRES_IN`）
- 登录成功更新 `last_login_at`
- 登录失败限流：同一 IP 5 次/分钟

#### 3.1.2 `POST /admin/auth/logout`（Admin JWT）

```typescript
// 响应
{ "message": "已退出登录" }
```

实现方式（可选）：
- 方案 A：纯前端清除 token（后端无状态，简单）
- 方案 B：后端 JWT 黑名单（Redis 缓存已吊销的 token，更安全但更重）
- **推荐方案 A**，后续需要时再升级为 B

#### 3.1.3 `GET /admin/auth/me`（Admin JWT）

```typescript
// 响应
{
  "id": "uuid",
  "username": "admin",
  "displayName": "超级管理员",
  "role": "admin"
}
```

### 3.2 Admin JWT 中间件

**新建文件**：`tarot-backend/src/middleware/admin-auth.ts`

```typescript
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

interface AdminJwtPayload {
  sub: string     // admin.id
  username: string
  role: string    // 'admin' | 'readonly'
  type: 'admin'
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: '请先登录' })
    return
  }

  const secret = config.jwtSecret || 'dev-secret-do-not-use-in-production'

  try {
    const decoded = jwt.verify(token, secret) as AdminJwtPayload
    if (decoded.type !== 'admin') {
      res.status(403).json({ error: 'FORBIDDEN', message: '非管理员 token' })
      return
    }
    req.adminId = decoded.sub
    req.adminUsername = decoded.username
    req.adminRole = decoded.role
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' })
      return
    }
    res.status(401).json({ error: 'UNAUTHORIZED', message: '无效的 token' })
  }
}
```

### 3.3 平滑切换策略

为避免一次性切换造成中断，提供切换窗口：

**环境变量**：`ADMIN_AUTH_MODE`（可选值：`api_key` | `jwt` | `dual`）

| 模式 | 行为 |
|:---|:---|
| `api_key` | 当前行为，仅用 `authMiddleware` 校验 API Key |
| `jwt` | 仅用 `adminAuthMiddleware` 校验 Admin JWT |
| `dual`（默认） | 两者任一通过即可（过渡期） |

`dual` 模式组合中间件：

```typescript
// src/middleware/admin-compat.ts
export function adminCompatMiddleware(req: Request, res: Response, next: NextFunction): void {
  const mode = process.env.ADMIN_AUTH_MODE || 'dual'
  if (mode === 'api_key') return authMiddleware(req, res, next)
  if (mode === 'jwt') return adminAuthMiddleware(req, res, next)
  // dual: 先尝试 API Key，再尝试 JWT
  // 实现略...
}
```

---

## §4 Admin 前端

### 4.1 LoginView 页面

**新建文件**：`tarot-admin/src/views/LoginView.vue`

页面内容：
- 用户名输入框 + 密码输入框
- "登录" 按钮（loading 状态）
- 错误提示（用户名或密码错误）
- 简单美观的居中卡片布局
- 暗色/亮色主题适配

### 4.2 认证状态管理

**新建文件**：`tarot-admin/src/composables/useAuth.ts`

```typescript
import { ref, computed } from 'vue'

interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
}

const token = ref<string | null>(localStorage.getItem('admin_token'))
const admin = ref<AdminInfo | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string): Promise<void> {
    const res = await fetch(`${BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.message || '登录失败')
    }
    const data = await res.json()
    token.value = data.token
    admin.value = data.admin
    localStorage.setItem('admin_token', data.token)
  }

  function logout(): void {
    token.value = null
    admin.value = null
    localStorage.removeItem('admin_token')
  }

  function getAuthHeaders(): Record<string, string> {
    if (!token.value) return {}
    return { 'Authorization': `Bearer ${token.value}` }
  }

  return { isLoggedIn, admin, token, login, logout, getAuthHeaders }
}
```

### 4.3 路由守卫

**文件**：`tarot-admin/src/router/index.ts`

```typescript
import { useAuth } from '@/composables/useAuth'

router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useAuth()
  if (to.path === '/login') {
    // 已登录则跳转到首页
    if (isLoggedIn.value) return next('/')
    return next()
  }
  // 未登录则跳转到登录页
  if (!isLoggedIn.value) return next('/login')
  next()
})
```

### 4.4 路由注册

```typescript
{
  path: '/login',
  name: 'login',
  component: () => import('@/views/LoginView.vue'),
  meta: { title: '登录', layout: 'blank' },  // blank 布局，不显示侧边栏
}
```

### 4.5 请求层适配

修改 `request()` 函数，从 `useAuth` 读取 token：

> 注意：在切换完成前，`request()` 继续用 `VITE_API_KEY` 作为 `Authorization: Bearer <apiKey>`。切换到 JWT 后改为 `Authorization: Bearer <adminJwt>`。`dual` 期间两者均可。

---

## §5 切换步骤

| 阶段 | 操作 | 风险 |
|:---:|------|:---:|
| 1 | 后端新增 `admins` 表 + 认证接口 + `adminAuthMiddleware` + `ADMIN_AUTH_MODE=dual` | 低 |
| 2 | Admin 端新增登录页 + 路由守卫，`request()` 适配双轨 | 中 |
| 3 | 验证 Admin JWT 登录流程正常 | 低 |
| 4 | 切换 `ADMIN_AUTH_MODE=jwt`，移除 API_KEY 相关逻辑 | 中 |
| 5 | 清理：移除 `authMiddleware`（如无其他地方使用）+ 删除 `ADMIN_AUTH_MODE` 环境变量 | 低 |

---

## §6 安全注意

- 密码使用 **bcrypt**（cost ≥ 10）哈希存储，永不明文
- JWT secret 复用现有 `JWT_SECRET` 环境变量（或新增 `ADMIN_JWT_SECRET`）
- JWT 过期时间默认 24h，可配置
- 登录失败限流：同一 IP 5 次/分钟（复用现有 `rateLimitMiddleware`）
- `is_active = 0` 的管理员即使密码正确也无法登录
- `readonly` 角色：后端接口需额外校验（如 `PUT /api/config/:key` 拒绝 readonly）
- 首次初始化管理员：通过环境变量 `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD` 或启动脚本

---

## §7 不影响的部分

以下体系完全独立，不受本方案影响：
- 小程序用户认证（`users` 表 + `jwtAuthMiddleware`）
- API_KEY 在过渡期内继续有效
- `tarot-miniprogram/docs/AUTH_PLAN.md` Part 1（日志显示用户信息）
- `tarot-admin/docs/ADMIN_USERS_PLAN.md`（用户管理页面）
