# 管理员管理功能实现方案

> 状态：待实施  
> 创建日期：2025-06-24

## 背景

当前 `tarot-admin` 项目只有初始管理员 `admin`，缺少完整的管理员新增、修改、删除功能。需要补全后端 CRUD 接口和前端管理页面。

---

## 后端改造（tarot-backend）

### 1. `src/db/admin.ts` — 新增 4 个数据库操作函数

| 函数 | 说明 |
|------|------|
| `listAdmins(page, pageSize, search?)` | 分页列出所有管理员，支持按 username/displayName 模糊搜索 |
| `updateAdmin(id, data)` | 修改 displayName、role、is_active |
| `deleteAdmin(id)` | 软删除（设置 is_active=0） |
| `resetAdminPassword(id, hashedPassword)` | 重置管理员密码，设置 must_change_password=1 |

**已有可复用函数**：`createAdmin()` 已存在于该文件中。

### 2. `src/index.ts` — 新增 5 个 API 路由

所有路由均需 `adminAuthMiddleware` + **role='admin' 校验**（只允许超管操作）：

| 方法 | 路径 | 说明 | 限制 |
|------|------|------|------|
| `GET` | `/api/admin/admins` | 获取管理员列表（分页+搜索） | role=admin |
| `POST` | `/api/admin/admins` | 创建管理员 | role=admin |
| `PUT` | `/api/admin/admins/:id` | 编辑管理员 | role=admin，禁止禁用自己 |
| `DELETE` | `/api/admin/admins/:id` | 删除（软删除）管理员 | role=admin，禁止删除自己 |
| `POST` | `/api/admin/admins/:id/reset-password` | 重置密码 | role=admin，强制改密 |

---

## 前端改造（tarot-admin）

### 3. `src/types/index.ts` — 新增类型定义

```ts
interface AdminEntry {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'readonly';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AdminListResponse {
  list: AdminEntry[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateAdminRequest {
  username: string;
  displayName: string;
  password: string;
  role: 'admin' | 'readonly';
}

interface UpdateAdminRequest {
  displayName?: string;
  role?: 'admin' | 'readonly';
  isActive?: boolean;
}

interface ResetPasswordRequest {
  password: string;
}
```

### 4. `src/api/index.ts` — 新增 5 个 API 函数

- `fetchAdmins(page, pageSize, search?)` → `GET /api/admin/admins`
- `createAdmin(data)` → `POST /api/admin/admins`
- `updateAdmin(id, data)` → `PUT /api/admin/admins/:id`
- `deleteAdmin(id)` → `DELETE /api/admin/admins/:id`
- `resetAdminPassword(id, data)` → `POST /api/admin/admins/:id/reset-password`

### 5. `src/views/AdminsView.vue` — 新建管理员管理页面

**页面功能**：

| 区域 | 功能 |
|------|------|
| 操作栏 | 搜索框（按用户名/显示名，300ms 防抖）、新增管理员按钮 |
| 数据表格 | 列：用户名、显示名、角色标签、状态标签、最后登录时间、创建时间、操作列 |
| 分页 | 上一页/下一页 + 页码显示 |
| 空状态 | 无管理员时展示引导提示 |

**弹窗表单**：

| 弹窗 | 字段 | 校验 |
|------|------|------|
| 新建管理员 | 用户名、显示名、密码（≥8位+字母+数字）、角色 | 用户名唯一 |
| 编辑管理员 | 显示名、角色、启用/禁用开关 | — |
| 删除确认 | 二次确认文案 | 禁止删除自己 |
| 重置密码 | 新密码（≥8位+字母+数字） | 重置后强制改密 |

### 6. `src/router/index.ts` — 新增路由

```ts
{
  path: '/admins',
  name: 'admins',
  component: () => import('@/views/AdminsView.vue'),
  meta: { title: '管理员管理', requireAuth: true, requireRole: 'admin' }
}
```

路由守卫中增加 `requireRole` 校验。

### 7. `src/components/layout/Sidebar.vue` — 新增菜单项

在侧边栏增加「管理员管理」菜单项，仅当 `admin.role === 'admin'` 时显示。

---

## 权限设计

| 规则 | 说明 |
|------|------|
| 只有 `role='admin'` 的超管能看见菜单 | 前端 `v-if` 控制 |
| 只有 `role='admin'` 的超管能调用 API | 后端 JWT + role 双重校验 |
| 禁止操作自己 | 超管不能删除/禁用自己的账号 |
| 重置密码后强制改密 | `must_change_password=1` |
| `readonly` 角色 | 看不到菜单，无法调用管理 API |

---

## API 响应格式

沿用现有统一格式：

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

列表接口返回分页结构：

```json
{
  "success": true,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 实施清单

| # | 项目 | 文件 | 操作 |
|:--:|------|------|:--:|
| 1 | tarot-backend | `src/db/admin.ts` | 新增 listAdmins / updateAdmin / deleteAdmin / resetAdminPassword |
| 2 | tarot-backend | `src/index.ts` | 注册 5 个新 API 路由 |
| 3 | tarot-admin | `src/types/index.ts` | 新增 AdminEntry / AdminListResponse 等类型 |
| 4 | tarot-admin | `src/api/index.ts` | 新增 5 个 API 调用函数 |
| 5 | tarot-admin | `src/views/AdminsView.vue` | **新建**管理员管理页面 |
| 6 | tarot-admin | `src/router/index.ts` | 新增 /admins 路由 |
| 7 | tarot-admin | `src/composables/useAuth.ts` | 支持 role 守卫逻辑（如需要） |
| 8 | tarot-admin | `src/components/layout/Sidebar.vue` | 新增管理员管理菜单项 |

---

## 提交计划

```bash
# 提交 1：后端接口
feat(reading-api): 新增管理员列表/创建/编辑/删除/重置密码接口

# 提交 2：前端页面
feat(miniprogram): 新增管理员管理页面 + 超管权限控制
```

---

## 注意事项

1. **软删除**：删除管理员时设置 `is_active=0`，保留数据库记录
2. **密码安全**：重置密码时使用 bcrypt 哈希，与登录密码处理一致
3. **防抖搜索**：搜索输入框 300ms 防抖，避免频繁 API 调用
4. **乐观更新**：编辑后直接更新本地列表数据，减少请求
5. **错误处理**：所有 API 调用需 try/catch 并给出用户友好提示
