# 双 Token 自动刷新方案

> 管理员认证升级：单 Token → Access Token + Refresh Token

## 目标

- Access Token 短效（默认 2h），用于业务 API 鉴权
- Refresh Token 长效（默认 30d），用于自动刷新 Access Token
- Access Token 过期后前端自动用 Refresh Token 换取新 Token，用户无感知
- Refresh Token 也过期时才跳转登录页
- 过期时间可在管理面板配置页动态修改

## 架构图

```
登录 → 返回 accessToken (2h) + refreshToken (30d)
  ↓
API 请求携带 accessToken
  ↓
accessToken 过期 → 后端返回 401 TOKEN_EXPIRED
  ↓
前端自动用 refreshToken 调用 /admin/auth/refresh
  ↓
后端验证 refreshToken → 签发新 accessToken + refreshToken（rotation）
  ↓
前端用新 accessToken 重试原请求
  ↓
refreshToken 也过期 (30d) → 后端返回 401 REFRESH_EXPIRED → 跳转登录页
```

---

## 后端改动（tarot-backend）

### 1. 新增配置项

**文件**: `src/config.ts`

在 `configMeta` 数组中新增两个可编辑配置：

在 `config` 对象中：

```typescript
adminAccessExpiresIn: process.env.ADMIN_ACCESS_EXPIRES_IN || '2h',
adminRefreshExpiresIn: process.env.ADMIN_REFRESH_EXPIRES_IN || '30d',
```

在 `updateConfig` 中：

```typescript
case 'ADMIN_ACCESS_EXPIRES_IN':
  config.adminAccessExpiresIn = value
  break
case 'ADMIN_REFRESH_EXPIRES_IN':
  config.adminRefreshExpiresIn = value
  break
```

### 2. 修改 admin-auth 中间件

**文件**: `src/middleware/admin-auth.ts`

修改 `AdminJwtPayload` 接口：

```typescript
export interface AdminJwtPayload {
  sub: string        // admin.id
  username?: string  // access token 才有
  role?: string      // access token 才有
  type: 'admin'
  tokenType: 'access' | 'refresh'
}
```

修改中间件验证逻辑：

```typescript
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // ...提取 token（不变）...

  try {
    const decoded = jwt.verify(token, secret) as AdminJwtPayload

    if (decoded.type !== 'admin') {
      res.status(403).json({ error: 'FORBIDDEN', message: '非管理员 token' })
      return
    }

    // 业务接口只接受 access token
    if (decoded.tokenType !== 'access') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '无效的 token' })
      return
    }

    ;(req as any).adminId = decoded.sub
    ;(req as any).adminUsername = decoded.username
    ;(req as any).adminRole = decoded.role

    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' })
      return
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '无效的 token' })
      return
    }
    log.error({ err }, 'Admin JWT verification failed')
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' })
  }
}
```

### 3. 修改登录接口

**文件**: `src/index.ts`（第 219-235 行）

将签发单 token 改为签发双 token：

```typescript
const secret = config.jwtSecret || 'dev-secret-do-not-use-in-production'

// 签发 access token（短效，含用户信息）
const accessToken = jwt.sign(
  { sub: admin.id, username: admin.username, role: admin.role, type: 'admin', tokenType: 'access' },
  secret,
  { expiresIn: (config.adminAccessExpiresIn || '2h') as import('ms').StringValue },
)

// 签发 refresh token（长效，仅含 ID）
const refreshToken = jwt.sign(
  { sub: admin.id, type: 'admin', tokenType: 'refresh' },
  secret,
  { expiresIn: (config.adminRefreshExpiresIn || '30d') as import('ms').StringValue },
)

res.json({
  accessToken,
  refreshToken,
  admin: {
    id: admin.id,
    username: admin.username,
    displayName: admin.display_name,
    role: admin.role,
  },
  mustChangePassword: admin.must_change_password === 1,
})
```

### 4. 新增刷新接口

**文件**: `src/index.ts`，在登出接口后新增：

```typescript
// Admin 刷新 Token（用 refreshToken 换取新 token 对）
app.post('/admin/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string }

  if (!refreshToken) {
    res.status(400).json({ error: 'INVALID_INPUT', message: '缺少 refreshToken' })
    return
  }

  const secret = config.jwtSecret || 'dev-secret-do-not-use-in-production'

  try {
    const decoded = jwt.verify(refreshToken, secret) as AdminJwtPayload

    // 验证 token 类型
    if (decoded.type !== 'admin' || decoded.tokenType !== 'refresh') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '无效的 token' })
      return
    }

    // 查找管理员（确认账号仍有效）
    const admin = await findAdminById(decoded.sub)
    if (!admin || admin.is_active !== 1) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '账号不存在或已禁用' })
      return
    }

    // 签发新的 access token
    const newAccessToken = jwt.sign(
      { sub: admin.id, username: admin.username, role: admin.role, type: 'admin', tokenType: 'access' },
      secret,
      { expiresIn: (config.adminAccessExpiresIn || '2h') as import('ms').StringValue },
    )

    // 签发新的 refresh token（rotation）
    const newRefreshToken = jwt.sign(
      { sub: admin.id, type: 'admin', tokenType: 'refresh' },
      secret,
      { expiresIn: (config.adminRefreshExpiresIn || '30d') as import('ms').StringValue },
    )

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'REFRESH_EXPIRED', message: '登录已过期，请重新登录' })
      return
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '无效的 token' })
      return
    }
    log.error({ err }, 'Admin token refresh failed')
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' })
  }
})
```

### 5. 修改登录响应兼容

**文件**: `src/index.ts`（第 226-235 行）

将返回的 `token` 字段改为 `accessToken` + `refreshToken`。

---

## 前端改动（tarot-admin）

### 6. 修改 useAuth composable

**文件**: `src/composables/useAuth.ts`

```typescript
import { ref, computed, readonly } from 'vue'

interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
  mustChangePassword: boolean
}

const ACCESS_TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'
const ADMIN_KEY = 'admin_info'

const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY))
const admin = ref<AdminInfo | null>(loadAdminInfo())

function loadAdminInfo(): AdminInfo | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || ''
}

export function useAuth() {
  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(username: string, password: string): Promise<AdminInfo> {
    const base = getBaseUrl()
    const res = await fetch(`${base}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '登录失败')
    }

    accessToken.value = body.accessToken
    refreshToken.value = body.refreshToken
    admin.value = {
      ...body.admin,
      mustChangePassword: body.mustChangePassword === true,
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, body.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, body.refreshToken)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))

    return admin.value!
  }

  function logout(): void {
    accessToken.value = null
    refreshToken.value = null
    admin.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  function getAuthHeaders(): Record<string, string> {
    if (!accessToken.value) return {}
    return { Authorization: `Bearer ${accessToken.value}` }
  }

  async function refreshAccessToken(): Promise<string> {
    const base = getBaseUrl()
    const res = await fetch(`${base}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '刷新失败')
    }

    accessToken.value = body.accessToken
    refreshToken.value = body.refreshToken
    localStorage.setItem(ACCESS_TOKEN_KEY, body.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, body.refreshToken)

    return body.accessToken
  }

  async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const base = getBaseUrl()
    const headers = getAuthHeaders()
    const res = await fetch(`${base}/admin/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ oldPassword, newPassword }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '修改密码失败')
    }

    if (admin.value) {
      admin.value = { ...admin.value, mustChangePassword: false }
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))
    }

    logout()
  }

  return {
    isLoggedIn,
    admin: readonly(admin),
    token: readonly(accessToken),  // 兼容现有代码
    login,
    logout,
    refreshAccessToken,
    changePassword,
    getAuthHeaders,
  }
}
```

### 7. 修改 api/index.ts（核心拦截器）

**文件**: `src/api/index.ts`

```typescript
import type { ServiceInfo, HealthResponse, LogListResponse, LogEntry, MetricsSnapshot, ConfigResponse, UserListResponse, AdminListResponse, AdminEntry, CreateAdminRequest, UpdateAdminRequest, ResetPasswordRequest, ApiResponse } from '@/types'
import { useAuth } from '@/composables/useAuth'

const BASE = import.meta.env.VITE_API_BASE_URL

// 全局刷新状态（防止并发请求重复刷新）
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

function getAuthHeaders(): Record<string, string> {
  return useAuth().getAuthHeaders()
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers || {}) }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // 401 自动刷新
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}))

    // access token 过期 → 尝试刷新
    if (body.error === 'TOKEN_EXPIRED') {
      // 并发安全：多个请求同时 401 时只发一次 refresh
      if (isRefreshing && refreshPromise) {
        const newToken = await refreshPromise
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(`${BASE}${path}`, { ...options, headers })
        if (retryRes.ok) return retryRes.json() as Promise<T>
      }

      isRefreshing = true
      refreshPromise = useAuth().refreshAccessToken()

      try {
        const newToken = await refreshPromise
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(`${BASE}${path}`, { ...options, headers })
        if (!retryRes.ok) throw new Error('请求失败')
        return retryRes.json() as Promise<T>
      } catch {
        useAuth().logout()
        window.location.href = '/login'
        throw new Error('登录已过期，请重新登录')
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    }

    // refresh token 过期 → 直接登出
    if (body.error === 'REFRESH_EXPIRED') {
      useAuth().logout()
      window.location.href = '/login'
    }

    throw new Error(body.message || `HTTP ${res.status}`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ...其余函数不变...
```

---

## 配置页面适配

### 8. 修改 ConfigView.vue

**文件**: `src/views/ConfigView.vue`

配置项 `ADMIN_ACCESS_EXPIRES_IN` 和 `ADMIN_REFRESH_EXPIRES_IN` 会自动显示在"安全配置"分组中（后端 `configMeta` 已定义），前端无需修改。

支持的格式：`2h`、`30m`、`7d`、`30d` 等（`ms` 库格式）。

---

## 改动文件清单

| 文件 | 改动内容 |
|------|---------|
| `tarot-backend/src/config.ts` | 新增 `adminAccessExpiresIn` / `adminRefreshExpiresIn` 配置 |
| `tarot-backend/src/middleware/admin-auth.ts` | `AdminJwtPayload` 新增 `tokenType` 字段，验证 access token |
| `tarot-backend/src/index.ts` | 登录接口返回双 token + 新增 `/admin/auth/refresh` 接口 |
| `tarot-admin/src/composables/useAuth.ts` | 存储双 token + 新增 `refreshAccessToken()` 方法 |
| `tarot-admin/src/api/index.ts` | 添加 401 拦截器 + 自动刷新逻辑 |

---

## 测试清单

1. **登录**：登录后返回 `accessToken` + `refreshToken`，存入 localStorage
2. **正常请求**：使用 access token 调用 API，正常返回
3. **access token 过期**：等待过期后调用 API，自动刷新并重试，用户无感知
4. **refresh token 过期**：等待 refresh token 过期后，跳转登录页
5. **并发请求**：多个请求同时 401 时，只发一次 refresh 请求
6. **配置修改**：在配置页面修改过期时间后立即生效
7. **登出**：登出后清除所有 token
8. **页面刷新**：刷新页面后仍保持登录状态（token 从 localStorage 恢复）
