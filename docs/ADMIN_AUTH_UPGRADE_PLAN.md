# 管理后台认证升级方案

> 创建时间：2026-06-24
> 用户需求：默认账号 admin / admin@123456，登录后强制改密，完全移除 API Key 兼容

## 一、默认账号 & 强制改密（后端 `tarot-backend`）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `src/config.ts` | `ADMIN_INIT_USERNAME` 默认 `'admin'`；`ADMIN_INIT_PASSWORD` 默认 `'admin@123456'`；删除 `ADMIN_AUTH_MODE` 配置项、`adminAuthMode` 字段、相关 switch case |
| 2 | `src/db/index.ts` | `admins` 表新增 `must_change_password INTEGER DEFAULT 0`；`ALTER TABLE` 兼容旧库 |
| 3 | `src/db/admin.ts` | `AdminRow` 加 `must_change_password`；新增 `findAdminById` / `setMustChangePassword` / `changePassword`（含密码强度 ≥8 位 + 字母+数字）/ `validatePasswordStrength`；`initAdminIfNeeded()` 创建时强制 `must_change_password=1` |
| 4 | `src/middleware/admin-compat.ts` | **删除**（完全移除 API Key 兼容） |
| 5 | `src/middleware/auth.ts` | 若仅做 API Key 校验则一并删；若还有别用法则保留 |
| 6 | `src/index.ts` | 全部 `adminCompatMiddleware` → `adminAuthMiddleware`；`/admin/auth/login` 响应加 `mustChangePassword`；`/admin/auth/me` 改为查 DB 真实字段；新增 `POST /admin/auth/change-password`（Admin JWT 鉴权）；`start()` 加默认账号提示日志 |
| 7 | `.env.example` | 删 `API_KEY`；加 `ADMIN_INIT_*` 说明 |
| 8 | `package.json` | 2.1.0 → 2.2.0（`npm version minor`） |
| 9 | `CHANGELOG.md` | 新增 `[2.2.0] Added/Changed/Removed` |

## 二、移除 API Key 兼容（前端 `tarot-admin`）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `src/api/index.ts` | 移除 `VITE_API_KEY` fallback，纯 JWT；新增 `changePassword()` |
| 2 | `src/composables/useAuth.ts` | 新增 `changePassword(old, new)` 方法 |
| 3 | `src/views/ChangePasswordView.vue` | **新建** — 旧密码/新密码/确认密码表单，空白布局，提交后回首页 |
| 4 | `src/views/LoginView.vue` | 登录成功根据 `mustChangePassword` 决定跳 `/change-password` 或 `/` |
| 5 | `src/router/index.ts` | 新增 `/change-password` 路由（`layout: 'blank'`，`requiresAuth: true`）；守卫扩展：登录但 `mustChangePassword=true` → 强制 `/change-password`（除 `/login`）；已改密访问 `/change-password` → `/` |
| 6 | `src/components/layout/TopBar.vue` | 右侧用户菜单（`admin.displayName`）— 下拉三项：修改密码（跳 `/change-password`）、退出登录 |
| 7 | `src/types/index.ts` | `AdminInfo` 加 `mustChangePassword: boolean` |
| 8 | `.env.example` | 删 `VITE_API_KEY` |
| 9 | `package.json` | 2.1.0 → 2.2.0 |
| 10 | `CHANGELOG.md` | 新增 `[2.2.0] Added/Removed` |

## 三、关键设计点

1. **默认密码必改**：`initAdminIfNeeded()` 创建账号时 `must_change_password=1`，强制走 `/change-password` 流程
2. **改密路由守卫**：未登录跳 `/login`、登录未改密跳 `/change-password`、已改密访问改密页跳 `/`，三态完整覆盖
3. **API Key 兼容完全删除**：`admin-compat.ts` 删除，`auth.ts` 视内容决定，`config.ts` 不再有 `ADMIN_AUTH_MODE`
4. **TopBar 用户菜单**：Popover/Dropdown 实现，displayName + role 展示，下拉「修改密码 / 退出登录」
5. **密码强度**：≥8 位 + 含字母 + 含数字
6. **改密页面**：空白布局（`layout: 'blank'`），与登录页一致

## 四、提交策略

```bash
# 提交 1
feat(backend): 默认管理员账号 + 强制改密 + 移除 API Key 兼容
→ 触发 MINOR bump → 2.2.0

# 提交 2
feat(admin): 改密流程 + 用户菜单 + 移除 API Key fallback
→ 触发 MINOR bump → 2.2.0
```
