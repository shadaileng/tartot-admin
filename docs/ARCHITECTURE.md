# 架构设计文档

> 本文档描述 tarot-admin 的技术架构、设计决策和数据流。

---

## 一、整体架构

```
浏览器
  │
  ▼
Vite Dev Server (localhost:5173)
  ├── 静态资源服务 (HTML/CSS/JS)
  ├── HMR (热模块替换)
  └── API Proxy ──────────→ tarot-backend (localhost:3000)
                                ├── GET /
                                ├── GET /health
                                ├── GET /logs
                                ├── GET /logs/:id
                                └── GET /metrics
```

---

## 二、前端架构

### 2.1 分层结构

```
src/
├── views/           # 页面级组件（路由目标）
├── components/      # UI 组件（按功能分组）
├── composables/     # 可复用逻辑（Hooks）
├── api/             # 数据获取层
├── types/           # TypeScript 类型定义
└── router/          # 路由配置
```

### 2.2 数据流

```
API Layer (api/index.ts)
  │  fetch → JSON → TypeScript 类型
  ▼
Composables (useHealth, useTheme)
  │  状态管理 + 轮询
  ▼
Views (DashboardView, LogsView, ...)
  │  数据绑定
  ▼
Components (StatusCard, LogTable, ...)
  │  渲染 UI
  ▼
浏览器 DOM
```

### 2.3 状态管理

本项目未引入 Pinia/Vuex，使用 Vue 3 原生方案：

- **组件局部状态**: `ref()` / `reactive()`
- **跨组件共享**: Props + Events（父子组件）
- **全局状态**: Composables 单例（`useTheme`、`useHealth`）
- **持久化**: `localStorage`（主题偏好）

---

## 三、主题系统

### 3.1 实现方案

使用 Tailwind CSS 4 的 `dark:` variant + class 策略：

```typescript
// composables/useTheme.ts
const theme = ref<'light' | 'dark'>(
  localStorage.getItem('tarot-admin-theme') ||
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
)

// 切换时在 <html> 上添加/移除 .dark class
document.documentElement.classList.toggle('dark', theme.value === 'dark')
```

### 3.2 使用方式

```vue
<!-- Tailwind class -->
<div class="bg-white dark:bg-gray-900">

<!-- Composable -->
const { theme, toggle } = useTheme()
```

---

## 四、组件设计

### 4.1 布局组件

| 组件 | 职责 |
|------|------|
| `AppLayout` | 主布局容器（flex: 侧边栏 + 内容区） |
| `Sidebar` | 侧边栏导航（5 个路由链接） |
| `TopBar` | 顶栏（页面标题） |
| `ThemeToggle` | 主题切换按钮 |

### 4.2 业务组件

| 组件 | 位置 | 职责 |
|------|------|------|
| `StatusCard` | dashboard/ | 服务状态卡片 |
| `MetricCard` | dashboard/ | 可复用指标卡片 |
| `HealthCard` | health/ | 健康状态指标 |
| `CacheStatus` | health/ | 缓存状态可视化 |
| `PoolStatus` | health/ | 浏览器池状态 |
| `LogTable` | logs/ | 日志分页表格 |
| `LogDetail` | logs/ | 日志详情弹窗（Teleport） |
| `LogFilter` | logs/ | 筛选器 + 分页 |

### 4.3 设计原则

- **原子化样式**: 使用 Tailwind utility class，不写自定义 CSS
- **暗色适配**: 每个颜色同时提供 `dark:` 变体
- **响应式**: 使用 Tailwind 响应式前缀（`md:`、`lg:`）
- **无状态组件**: 通过 props 接收数据，通过 events 向上传递操作

---

## 五、构建与部署

### 5.1 开发环境

```bash
pnpm dev
# Vite dev server: http://localhost:5173
# API proxy → http://localhost:3000
```

### 5.2 生产构建

```bash
pnpm build
# 输出: dist/
# 需要配置 VITE_API_BASE_URL 指向后端地址
```

### 5.3 部署方式

| 方式 | 说明 |
|------|------|
| 静态托管 | `dist/` 目录部署到 Nginx/Cloudflare Pages |
| Docker | 多阶段构建，Nginx 托管 |
| 同域部署 | 与 tarot-backend 同域名，无需 CORS 配置 |

---

## 六、与后端交互

### 6.1 开发环境 (Vite Proxy)

```typescript
// vite.config.ts
server: {
  proxy: {
    '/health': 'http://localhost:3000',
    '/logs': 'http://localhost:3000',
    '/metrics': 'http://localhost:3000',
  }
}
```

### 6.2 生产环境

```bash
# 构建时注入
VITE_API_BASE_URL=https://your-backend.example.com
```

### 6.3 CORS 处理

tarot-backend 已配置 `CORS_ORIGIN=*`，前端可直接跨域请求。同域部署时无需额外配置。
