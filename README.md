# tarot-admin

塔罗牌后台管理面板 — 查看和管理 tarot-backend 服务的信息、配置、日志和指标

## 快速开始

### 前置条件

- Node.js 20+
- pnpm
- `tarot-backend` 运行在 `http://localhost:3000`

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（需先启动 tarot-backend）
pnpm dev
```

访问 `http://localhost:5173`。

### 生产构建

```bash
# 设置后端地址（可选，留空则需要反向代理）
VITE_API_BASE_URL=https://your-backend.example.com pnpm build

# 输出到 dist/
pnpm preview    # 本地预览
```

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 仪表盘 | `/` | 服务状态、核心指标概览 |
| 日志 | `/logs` | 分页表格、target 筛选、详情弹窗 |
| 健康监控 | `/health` | Gemini 状态、缓存/浏览器池可视化 |
| 指标 | `/metrics` | Prometheus 指标解析、Chart.js 柱状图 |
| 配置 | `/config` | 环境变量列表（按类别分组，API Key 脱敏） |

支持暗色/亮色主题切换，偏好保存在 localStorage。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| 路由 | Vue Router 4 |
| HTTP | 原生 fetch |
| 图表 | Chart.js 4 + vue-chartjs 5 |
| 包管理 | pnpm |

## 项目结构

```
tarot-admin/
├── index.html
├── package.json
├── vite.config.ts               # Vite 配置（proxy → localhost:3000）
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── docs/
│   ├── PLAN.md                  # 执行规划
│   ├── API.md                   # 后端 API 对接文档
│   └── ARCHITECTURE.md          # 架构设计文档
└── src/
    ├── api/index.ts             # fetch 封装 + API 调用
    ├── types/index.ts           # TypeScript 类型定义
    ├── router/index.ts          # 路由配置
    ├── composables/             # useTheme, useHealth
    ├── components/
    │   ├── layout/              # AppLayout, Sidebar, TopBar, ThemeToggle
    │   ├── dashboard/           # StatusCard, MetricCard
    │   ├── logs/                # LogTable, LogDetail, LogFilter
    │   └── health/              # HealthCard, CacheStatus, PoolStatus
    └── views/                   # 5 个页面视图
```

## 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | 空（使用 Vite proxy） |

- 开发环境：留空，Vite proxy 自动转发到 `http://localhost:3000`
- 生产环境：设置为后端地址，如 `https://api.example.com`

## 开发指南

### 后端依赖

本项目为纯前端应用，所有数据来自 `tarot-backend`。开发时需确保后端运行：

```bash
# 终端 1：启动后端
cd ../tarot-backend && pnpm run dev

# 终端 2：启动前端
pnpm dev
```

### Vite Proxy

开发环境下，以下路径的请求会自动代理到 `http://localhost:3000`：

- `/reading`、`/poster`、`/health`、`/metrics`、`/logs`、`/cards`

### API 端点

本项目仅使用后端的**只读**端点：

| 端点 | 用途 |
|------|------|
| `GET /` | 服务信息 |
| `GET /health` | 健康检查 |
| `GET /logs` | 日志查询 |
| `GET /logs/:id` | 日志详情 |
| `GET /metrics` | Prometheus 指标 |

## 部署

### 静态托管

```bash
pnpm build
# 将 dist/ 部署到 Nginx / Cloudflare Pages / Vercel
```

生产环境需要配置反向代理，将 API 请求转发到后端。

### Docker（示例）

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install && pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 同域部署

与 `tarot-backend` 部署在同一域名下，通过 Nginx 反向代理：

```nginx
location / {
    root /path/to/tarot-admin/dist;
    try_files $uri $uri/ /index.html;
}

location ~ ^/(health|logs|metrics|reading|poster|cards) {
    proxy_pass http://127.0.0.1:3000;
}
```
