# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-06-24

### Added

- 改密页面 `/change-password`：空白布局，旧密码/新密码/确认密码表单，首次登录强制跳转
- TopBar 用户菜单：头像缩写 + 显示名 + 角色，下拉「修改密码」「退出登录」
- 路由守卫增强：未改密强制跳转 `/change-password`，已改密访问改密页自动跳首页
- `useAuth` 新增 `changePassword` 方法，登录响应存储 `mustChangePassword` 标记

### Removed

- 完全移除 `VITE_API_KEY` 环境变量和 API Key fallback 认证，全部使用 Admin JWT

## [2.1.0] - 2026-06-24

### Added

- 管理员登录页面 `/login`：用户名+密码表单、加载状态、错误提示、居中卡片布局
- `useAuth` 组合式函数：token/登录/登出/Authorization header 管理，localStorage 持久化
- 路由守卫：未登录自动跳转 `/login`，已登录跳过登录页
- `App.vue` 支持 login 页面的 `blank` 布局（不显示侧边栏和顶部栏）
- 请求层 `api/index.ts` 适配双轨认证：优先使用 Admin JWT，回退到 API Key

## [2.0.0] - 2026-06-24

### Changed

- **BREAKING**: 所有 API 调用同步更新为 `/api` 前缀：
  - `fetchHealth()` 改为调用 `/api/health`
  - `fetchLogs()` 改为调用 `/api/logs`
  - `fetchLogById()` 改为调用 `/api/logs/:id`
  - `fetchMetricsRaw()` 改为调用 `/api/metrics`
- Vite dev proxy 简化为单条 `/api` 规则（适配后端路由统一加 `/api` 前缀）

## [1.4.0] - 2026-06-24

### Added

- 新增用户管理页面 `/users`，支持查看所有小程序用户的列表、搜索、请求统计
- 用户详情弹窗：展示完整个人信息（ID、昵称、邮箱、手机号、注册时间、最近登录、请求统计）
- 侧边栏新增「用户管理」导航入口

## [1.2.0] - 2026-06-20

### Changed

- 部署从 Cloudflare Pages 迁移到 Cloudflare Workers Assets
- `wrangler.toml` 改为 `[assets]` 配置，SPA 路由回退通过 `not_found_handling` 处理
- 删除 `public/_redirects`（Workers 原生支持 SPA 回退）
- `deploy:cf` 脚本改为 `wrangler deploy`
- GitHub Actions workflow 简化（移除 Pages 项目创建步骤）

## [1.1.0] - 2026-06-20

### Added

- Cloudflare Pages 部署支持：`public/_redirects` SPA 路由回退、`wrangler.toml` Wrangler 配置
- `pnpm deploy:cf` 一键部署脚本
- GitHub Actions 自动部署工作流（`.github/workflows/deploy.yml`），push `master` 自动触发
- Workflow 自动创建 Pages 项目（幂等，已存在则跳过）

## [1.0.0] - 2026-06-20

### Added

#### 仪表盘
- 服务状态卡片（服务名、版本、运行状态、Gemini API 状态）
- 核心指标概览（总请求数、错误数、平均耗时、缓存命中率）
- 快速概览卡片（缓存使用、浏览器池、API 端点数）

#### 日志查看
- 分页表格展示日志列表（时间、路径、状态码、耗时、类型、问题、模型）
- 按 target（reading / poster）筛选
- 状态码颜色标记（2xx 绿、4xx 橙、5xx 红）
- 点击行展开详情弹窗（问题、牌面 JSON、解读文本、模型、耗时、错误信息）

#### 健康监控
- Gemini API 配置状态
- 缓存状态可视化（使用量进度条、命中率）
- 浏览器池状态（可用/活跃/等待/最大）
- 请求指标（总数、错误数、平均耗时）

#### 指标可视化
- Prometheus 格式指标解析
- Chart.js 柱状图展示请求分布
- 缓存命中率、总请求、错误数指标卡片

#### 配置查看
- 环境变量列表（按类别分组）
- API Key 脱敏显示
- 运行时配置（端口、缓存大小、池大小等）

#### 基础设施
- Vue 3 + TypeScript + Tailwind CSS 4 + Vite 6
- Vue Router 4（SPA history 模式，5 个路由）
- 原生 fetch API 封装
- 暗色/亮色主题切换（Tailwind `dark:` variant + class 策略）
- localStorage 主题偏好持久化
- 健康数据自动轮询（5-10s 间隔）
- Vite 开发代理（转发到 tarot-backend）
- AGENTS.md / README.md / CHANGELOG.md 文档
- docs/PLAN.md / docs/API.md / docs/ARCHITECTURE.md 开发文档
