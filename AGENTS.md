# AGENTS.md — AI 协作指南

> 本文档帮助 AI 编程助手快速理解 `tarot-admin` 项目。
> 修改代码前请先阅读本文档。

## 项目概述

塔罗牌后台管理前端面板，用于查看和管理 `tarot-backend` 服务的信息、配置、日志和指标。

- **仪表盘**：服务状态卡片 + 核心指标概览
- **日志查看**：分页表格 + target 筛选 + 详情弹窗
- **健康监控**：Gemini API 状态 + 缓存/浏览器池可视化
- **指标可视化**：Prometheus 指标解析 + Chart.js 图表
- **配置查看**：环境变量列表（按类别分组，API Key 脱敏）
- **用户管理**：用户列表查看、搜索、请求统计、详情弹窗
- **管理员管理**（仅 admin 角色可见）：管理员列表、新增/编辑/删除
- **主题切换**：暗色/亮色，localStorage 持久化
- **认证系统**：JWT 登录、密码修改、首次登录强制改密、角色权限控制

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript（strict: true） |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4（`dark:` variant + class 策略） |
| 路由 | Vue Router 4（SPA history 模式） |
| HTTP | 原生 fetch |
| 图表 | Chart.js 4 + vue-chartjs 5 |
| 包管理 | pnpm |

## 项目结构

```
tarot-admin/
├── index.html                    # 入口 HTML
├── package.json                  # 依赖 + 脚本
├── tsconfig.json                 # TS 配置入口（references）
├── tsconfig.app.json             # 应用 TS 配置
├── tsconfig.node.json            # Node/Vite TS 配置
├── vite.config.ts                # Vite 配置（proxy、alias）
├── postcss.config.js             # PostCSS（autoprefixer）
├── .env.development              # 开发环境变量
├── .env.production               # 生产环境变量
├── .env.example                  # 环境变量模板
├── public/favicon.svg            # 网站图标
├── docs/
│   ├── PLAN.md                   # 执行规划
│   ├── API.md                    # 后端 API 对接文档
│   └── ARCHITECTURE.md           # 架构设计文档
└── src/
    ├── main.ts                   # 应用入口（创建 app、挂载 router）
    ├── App.vue                   # 根组件（AppLayout + RouterView）
    ├── style.css                 # Tailwind 指令 + 全局样式
    ├── env.d.ts                  # Vite 环境变量 + .vue 模块类型声明
    │
    ├── api/
    │   └── index.ts              # fetch 封装 + 各 API 调用函数
    │
    ├── types/
    │   └── index.ts              # TypeScript 接口（ServiceInfo, HealthResponse, LogEntry 等）
    │
    ├── router/
    │   └── index.ts              # 5 个路由配置 + beforeEach 标题更新
    │
    ├── composables/
    │   ├── useAuth.ts           # 管理员认证（JWT 登录/登出/改密/权限）
    │   ├── useTheme.ts           # 暗色/亮色切换 + localStorage 持久化
    │   └── useHealth.ts          # 健康数据轮询（5-10s 间隔）
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.vue     # 主布局（侧边栏 + 顶栏 + 内容区）
    │   │   ├── Sidebar.vue       # 侧边栏导航（7 个路由链接 + 角色权限过滤）
    │   │   ├── TopBar.vue        # 顶栏（页面标题）
    │   │   └── ThemeToggle.vue   # 主题切换按钮（太阳/月亮图标）
    │   │
    │   ├── dashboard/
    │   │   ├── StatusCard.vue    # 服务状态卡片（名称/版本/状态/Gemini）
    │   │   └── MetricCard.vue    # 可复用指标卡片（数字 + 标签 + 颜色图标）
    │   │
    │   ├── logs/
    │   │   ├── LogTable.vue      # 日志分页表格（时间/路径/状态/耗时/类型/问题/模型）
    │   │   ├── LogDetail.vue     # 日志详情弹窗（Teleport + fade 动画）
    │   │   └── LogFilter.vue     # target 筛选 + 上下页分页
    │   │
    │   └── health/
    │       ├── HealthCard.vue    # 健康状态指标卡片
    │       ├── CacheStatus.vue   # 缓存状态可视化（进度条）
    │       └── PoolStatus.vue    # 浏览器池状态（2x2 网格）
    │
    └── views/
        ├── DashboardView.vue     # 仪表盘页面
        ├── LogsView.vue          # 日志查看页面
        ├── HealthView.vue       # 健康监控页面
        ├── MetricsView.vue       # 指标可视化页面（Chart.js 柱状图）
        ├── ConfigView.vue        # 配置查看页面（环境变量分组展示）
        ├── UsersView.vue         # 用户管理页面（列表/搜索/详情弹窗）
        ├── AdminsView.vue        # 管理员管理页面（仅 admin 角色可见）
        ├── LoginView.vue         # 管理员登录页面
        └── ChangePasswordView.vue # 修改密码页面（首次登录强制跳转）
```

## 路由/页面结构

| 路径 | 名称 | 说明 | 权限 |
|------|------|------|------|
| `/login` | `login` | 管理员登录 | 无需登录（已登录自动跳转） |
| `/change-password` | `change-password` | 修改密码 | 需登录（首次登录强制跳转） |
| `/` | `dashboard` | 仪表盘（默认首页） | 需登录 |
| `/logs` | `logs` | 日志查看 | 需登录 |
| `/health` | `health` | 健康监控 | 需登录 |
| `/metrics` | `metrics` | 指标可视化 | 需登录 |
| `/config` | `config` | 配置查看 | 需登录 |
| `/users` | `users` | 用户管理 | 需登录 |
| `/admins` | `admins` | 管理员管理 | 仅 admin 角色 |

## 编码规范

1. **Composition API** — 所有组件使用 `<script setup lang="ts">`
2. **TypeScript strict 模式** — 所有类型需明确声明，禁止隐式 `any`
3. **Tailwind 原子化样式** — 不写自定义 CSS，使用 utility class
4. **暗色适配** — 每个颜色同时提供 `dark:` 变体（class 策略）
5. **路径别名** — 使用 `@/` 指向 `src/`，不使用相对路径 `../`
6. **Props/Emits** — 使用 TypeScript 接口定义，通过 `defineProps<>` / `defineEmits<>`
7. **状态管理** — 使用 `ref()` / `reactive()`，不引入 Pinia
8. **网络请求** — 使用原生 fetch，封装在 `src/api/index.ts`
9. **组件命名** — 页面组件 PascalCase（`DashboardView.vue`），UI 组件按功能分组

## API 对接

前端通过 `VITE_API_BASE_URL` 环境变量配置后端地址。

### 使用的后端端点

| 前端函数 | 后端端点 | 说明 |
|----------|---------|------|
| `login(username, password)` | `POST /admin/auth/login` | 管理员登录（返回 JWT + admin 信息） |
| `changePassword(old, new)` | `POST /admin/auth/change-password` | 修改管理员密码 |
| `fetchServiceInfo()` | `GET /` | 服务信息 |
| `fetchHealth()` | `GET /health` | 健康检查 |
| `fetchLogs(params)` | `GET /logs` | 日志分页查询 |
| `fetchLogById(id)` | `GET /logs/:id` | 日志详情 |
| `fetchMetricsRaw()` | `GET /metrics` | Prometheus 指标文本 |

### Vite Proxy（开发环境）

```typescript
// vite.config.ts
proxy: {
  '/reading': 'http://localhost:3000',
  '/poster': 'http://localhost:3000',
  '/health': 'http://localhost:3000',
  '/metrics': 'http://localhost:3000',
  '/logs': 'http://localhost:3000',
  '/cards': 'http://localhost:3000',
  '/admin': 'http://localhost:3000',
}
```

> 前置条件：`tarot-backend` 需在 `localhost:3000` 运行。

## 环境变量

| 变量 | 用途 | 默认值 | 必填 |
|------|------|--------|:----:|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | 空（使用 Vite proxy） | |

- 开发环境：留空，由 Vite proxy 转发到 `http://localhost:3000`
- 生产环境：设置为后端地址，如 `https://api.example.com`
- `.env.development` / `.env.production` 已被 `.gitignore` 忽略
- 部署时通过构建命令注入：`VITE_API_BASE_URL=https://... pnpm build`

## 命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发服务器 http://localhost:5173
pnpm build            # 类型检查 + 生产构建 → dist/
pnpm preview          # 预览构建产物
pnpm deploy:cf        # 构建 + 部署到 Cloudflare Workers
```

## 部署

### Cloudflare Workers

| 方式 | 说明 |
|------|------|
| `pnpm deploy:cf` | Wrangler CLI（构建 + 上传一键完成） |
| 手动分步 | `pnpm build` → `npx wrangler deploy` |
| GitHub Actions | `.github/workflows/deploy.yml`，push `master` 自动部署 |

> SPA 路由回退通过 `wrangler.toml` 中 `not_found_handling = "single-page-application"` 配置。
> 环境变量 `VITE_API_BASE_URL` 需在 GitHub vars 中配置。

## 主题系统

使用 Tailwind CSS 4 的 `dark:` variant + class 策略：

- `useTheme()` composable 管理主题状态
- 切换时在 `<html>` 上添加/移除 `.dark` class
- 首次访问跟随系统偏好（`prefers-color-scheme`）
- 持久化到 `localStorage`（key: `tarot-admin-theme`）

```vue
<!-- 组件中使用 -->
<div class="bg-white dark:bg-gray-900">
```

```typescript
// Composable
const { theme, toggle } = useTheme()
```

## 认证系统

使用 JWT 认证，通过 `useAuth()` composable 管理：

- **登录**：`POST /admin/auth/login` 获取 JWT token，存入 localStorage
- **登出**：清除 localStorage 中的 token 和 admin 信息
- **密码修改**：`POST /admin/auth/change-password`，成功后自动登出要求重新登录
- **首次登录强制改密**：`mustChangePassword` 标记为 true 时路由守卫自动跳转 `/change-password`
- **角色权限**：路由 meta `requireRole: 'admin'` 限制仅超级管理员可访问

### useAuth 使用

```typescript
const { admin, isLoggedIn, token, login, logout, changePassword, getAuthHeaders } = useAuth()

// 在 <script setup> 中访问 ref 值必须使用 .value
if (admin.value?.role === 'admin') { /* 管理员专属逻辑 */ }
```

## 已知限制

- 本项目为纯只读管理面板，不提供对后端的写入操作
- 所有 API 调用依赖 `tarot-backend` 运行在 `localhost:3000`
- 生产环境需自行配置反向代理或 CORS
- 指标数据为内存态（后端重启后清空）
