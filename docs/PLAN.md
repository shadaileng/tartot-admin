# 塔罗牌后台管理面板 — 执行规划

> 版本: v1.0.0 | 日期: 2026-06-20 | 状态: 初始版本

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| 项目名称 | tarot-admin |
| 技术栈 | Vue 3 + TypeScript + Tailwind CSS 4 + Vite + Vue Router + Chart.js |
| 目标 | 查看和管理 tarot-backend 服务的信息、配置、日志和指标 |
| 包管理 | pnpm |
| 后端依赖 | tarot-backend (Express + SQLite) |

---

## 二、功能模块

### 2.1 仪表盘 (Dashboard)

- 服务状态卡片（服务名、版本、运行状态、Gemini API 状态）
- 核心指标概览（总请求数、错误数、平均耗时、缓存命中率）
- 快速概览卡片（缓存使用、浏览器池、API 端点）

### 2.2 日志查看 (Logs)

- 分页表格展示日志列表
- 按 target（reading/poster）筛选
- 状态码颜色标记（2xx 绿、4xx 橙、5xx 红）
- 点击行展开详情弹窗（问题、牌面 JSON、解读文本、模型、耗时、错误信息）

### 2.3 健康监控 (Health)

- Gemini API 配置状态
- 浏览器池状态（可用/活跃/等待/最大）
- 缓存状态（当前大小、最大容量、命中率进度条）
- 请求指标（总数、错误数、平均耗时）

### 2.4 指标可视化 (Metrics)

- Prometheus 格式指标解析
- 柱状图展示请求分布（请求数/缓存命中/缓存未命中/错误数）
- 关键指标卡片（缓存命中率、总请求、错误数）

### 2.5 配置查看 (Config)

- 环境变量列表（按类别分组）
- API Key 脱敏显示
- 运行时配置（端口、缓存大小、池大小等）

### 2.6 主题切换

- 暗色/亮色主题切换
- localStorage 持久化
- 跟随系统偏好

---

## 三、技术选型

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 + TypeScript | Composition API + `<script setup>` |
| 构建 | Vite 6 | 快速 HMR |
| 样式 | Tailwind CSS 4 | 原子化 CSS，内置 dark mode |
| 路由 | Vue Router 4 | SPA 路由 |
| HTTP | 原生 fetch | 轻量，无需 axios |
| 图表 | Chart.js 4 + vue-chartjs 5 | 轻量图表 |
| 图标 | Heroicons SVG | Tailwind 官方配套 |

---

## 四、目录结构

```
tarot-admin/
├── index.html
├── package.json
├── wrangler.toml              # Cloudflare Workers Wrangler 配置
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── postcss.config.js
├── .env.development / .env.production
├── .env.example              # 环境变量模板
├── .gitignore
├── .github/workflows/deploy.yml  # GitHub Actions 自动部署
├── AGENTS.md                 # AI 协作指南
├── README.md                 # 项目说明
├── CHANGELOG.md              # 变更日志
├── public/favicon.svg
├── docs/
│   ├── PLAN.md               # 本文档
│   ├── API.md                # 后端 API 对接文档
│   ├── ARCHITECTURE.md       # 架构设计文档
│   ├── ADMIN_USERS_PLAN.md   # 用户管理页面规划
│   └── ADMIN_LOGIN_PLAN.md   # Admin 登录体系规划
└── src/
    ├── main.ts / App.vue / style.css / env.d.ts
    ├── api/index.ts
    ├── composables/ (useTheme, useHealth)
    ├── types/index.ts
    ├── router/index.ts
    ├── components/
    │   ├── layout/ (AppLayout, Sidebar, TopBar, ThemeToggle)
    │   ├── dashboard/ (StatusCard, MetricCard)
    │   ├── logs/ (LogTable, LogDetail, LogFilter)
    │   └── health/ (HealthCard, CacheStatus, PoolStatus)
    └── views/ (Dashboard, Logs, Health, Metrics, Config)
```

---

## 五、实现步骤

| 步骤 | 描述 | 状态 |
|------|------|------|
| Step 1 | 项目初始化（目录、配置文件、依赖安装） | ✅ 已完成 |
| Step 2 | 基础框架（类型定义、API 层、路由、主题） | ✅ 已完成 |
| Step 3 | 布局组件（AppLayout、Sidebar、TopBar） | ✅ 已完成 |
| Step 4 | Dashboard + Health 页面 | ✅ 已完成 |
| Step 5 | Logs + Metrics + Config 页面 | ✅ 已完成 |
| Step 6 | 文档创建 + 构建验证 | ✅ 已完成 |

---

## 六、启动命令

```bash
cd tarot-admin
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 输出到 dist/
pnpm preview      # 预览构建产物
```

---

## 七、环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | 空（使用 Vite proxy） |

开发环境通过 Vite proxy 转发 API 请求到 `http://localhost:3000`。
生产环境需要配置 `VITE_API_BASE_URL` 指向后端地址。
