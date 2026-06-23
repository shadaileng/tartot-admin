# Admin 端用户管理页面 — 实现方案

> 版本：v1.0 | 最后更新：2026-06-24 | 状态：规划中

## §0 背景

当前 Admin 后台可以查看所有日志，但无法直接管理"产生日志的用户"。管理员需要一个用户列表页面来：
- 查看所有注册用户（昵称、邮箱、登录方式、注册时间）
- 按昵称/邮箱搜索用户
- 查看某个用户的请求统计（请求次数、最近请求时间）
- （后续）查看某个用户的所有历史解读记录

> **注意**：这里管理的是「小程序用户」（来自 `users` 表），与 Admin 自己的登录体系无关。Admin 认证继续沿用 `API_KEY`，详见 `tarot-miniprogram/docs/AUTH_PLAN.md` §0。

---

## §1 数据库

### 1.1 现有 `users` 表结构

```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,       -- UUID
  openid     TEXT NOT NULL DEFAULT '',
  nickname   TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  email      TEXT,
  phone      TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);
```

无需 ALTER TABLE，已有字段满足需求。

### 1.2 查询索引

需要确认/新增：

```sql
-- 昵称搜索（模糊匹配用 LIKE，走全表扫描是合理的）
-- 邮箱搜索（同上）
-- 若请求量大，可考虑 FTS5 全文索引（暂不需要）
```

---

## §2 后端

### 2.1 新增 `queryUsers` 函数

**文件**：`tarot-backend/src/db/user.ts`

```typescript
export interface UserRow {
  id: string
  openid: string
  nickname: string
  avatar_url: string | null
  email: string | null
  phone: string | null
  created_at: string
  last_login_at: string | null
  request_count: number
  last_request_at: string | null
}

export interface UserQueryResult {
  total: number
  page: number
  limit: number
  data: UserRow[]
}

export async function queryUsers(
  page: number = 1,
  limit: number = 20,
  keyword?: string
): Promise<UserQueryResult> {
  const db = await getDb()
  const where: string[] = []
  const params: any[] = []

  if (keyword) {
    where.push('(u.nickname LIKE ? OR u.email LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

  // count
  const countResult = db.exec(
    `SELECT COUNT(*) as cnt FROM users u ${whereClause}`,
    params
  )
  const total = countResult.length > 0 && countResult[0].values.length > 0
    ? Number(countResult[0].values[0][0])
    : 0

  // data — 带请求统计
  const offset = (page - 1) * limit
  const stmt = db.prepare(`
    SELECT
      u.*,
      COUNT(l.id)   AS request_count,
      MAX(l.created_at) AS last_request_at
    FROM users u
    LEFT JOIN reading_logs l ON u.id = l.user_id
    ${whereClause}
    GROUP BY u.id
    ORDER BY last_request_at DESC
    LIMIT ? OFFSET ?
  `)
  stmt.bind([...params, limit, offset])
  const rows: UserRow[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as UserRow)
  }
  stmt.free()

  return { total, page, limit, data: rows }
}
```

### 2.2 注册路由

**文件**：`tarot-backend/src/index.ts`

```typescript
import { queryUsers } from './db/user.js'

// 放在 /api/config 路由附近
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const keyword = req.query.keyword as string | undefined
  const result = await queryUsers(page, limit, keyword)
  res.json(result)
})
```

鉴权：使用 `authMiddleware`（同 `/logs` / `PUT /api/config/:key`），不走 JWT。

---

## §3 Admin 前端

### 3.1 类型定义

**文件**：`tarot-admin/src/types/index.ts`

```typescript
export interface UserEntry {
  id: string
  openid: string
  nickname: string
  avatar_url: string | null
  email: string | null
  phone: string | null
  created_at: string
  last_login_at: string | null
  request_count: number
  last_request_at: string | null
}

export interface UserListResponse {
  total: number
  page: number
  limit: number
  data: UserEntry[]
}
```

### 3.2 API 函数

**文件**：`tarot-admin/src/api/index.ts`

```typescript
export function fetchUsers(params: {
  page?: number
  limit?: number
  keyword?: string
} = {}): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.keyword) query.set('keyword', params.keyword)
  const qs = query.toString()
  return request<UserListResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`)
}
```

### 3.3 UsersView 页面

**新建文件**：`tarot-admin/src/views/UsersView.vue`

页面功能：
- 搜索框（按昵称/邮箱模糊搜，带防抖 300ms）
- 用户列表表格：

| 列 | 说明 |
|:---|:---|
| 头像 | `avatar_url` 或默认头像 |
| 昵称 | `nickname` |
| 邮箱 | 脱敏显示 `a***@example.com` |
| 登录方式 | 图标 + 文字（微信 / 邮箱 / 微信+邮箱） |
| 注册时间 | `created_at` 格式化 |
| 最近请求 | `last_request_at` 格式化，无请求显示 `-` |
| 请求次数 | `request_count` |

- 分页控件（上一页/下一页 + 页码）
- 空状态提示
- 点击行查看用户详情弹窗（完整信息 + 头像大图）

### 3.4 路由

**文件**：`tarot-admin/src/router/index.ts`

新增路由：

```typescript
{
  path: '/users',
  name: 'users',
  component: () => import('@/views/UsersView.vue'),
  meta: { title: '用户管理' },
}
```

### 3.5 侧边栏菜单

**文件**：`tarot-admin/src/components/layout/Sidebar.vue`

在 `navItems` 数组中，「日志」之后新增：

```typescript
{
  name: 'users',
  label: '用户管理',
  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
}
```

---

## §4 实施步骤

| 序号 | 变更 | 依赖 | 提交 scope |
|:---:|------|------|:---:|
| 1 | 后端 `user.ts` 新增 `queryUsers` 函数 | Part 1 完成 | `reading-api` |
| 2 | 后端 `index.ts` 注册 `GET /api/admin/users` | 1 | `reading-api` |
| 3 | Admin `types/index.ts` 新增 `UserEntry` / `UserListResponse` | 2 | `miniprogram` |
| 4 | Admin `api/index.ts` 新增 `fetchUsers` | 2 | `miniprogram` |
| 5 | Admin `views/UsersView.vue` 新建 | 3,4 | `miniprogram` |
| 6 | Admin `router/index.ts` 新增 `/users` 路由 | 5 | `miniprogram` |
| 7 | Admin `Sidebar.vue` 新增「用户管理」菜单项 | 5 | `miniprogram` |

---

## §5 不在本方案范围

以下功能独立规划于 `ADMIN_LOGIN_PLAN.md`：
- Admin 登录页（用户名/密码）
- `admins` 表
- Admin JWT 体系

以下功能后续迭代：
- 点击用户行跳转到该用户的历史解读记录列表
- 用户详情弹窗中展示最近 N 条解读摘要
- 导出用户 CSV
