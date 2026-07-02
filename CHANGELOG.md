# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.3] - 2026-07-02

### Fixed

- 移除 401 处理中的 `window.location.href` 浏览器整页跳转，改用 `router.replace('/login')` SPA 内部跳转，彻底避免页面无限刷新循环
- `loadStoredTokens()` 同时校验 refresh token 过期，防止已过期 token 导致 /refresh 死循环

## [2.9.2] - 2026-07-02

### Fixed

- 修复 token 过期后并发请求导致的 fall-through bug，避免无限刷新循环
- 应用初始化时校验 JWT 过期时间，自动清除 localStorage 中的过期 token
- `request()` 添加重定向锁，防止多个并发 401 请求重复触发页面跳转
- 移除 `REFRESH_EXPIRED` 死代码分支，简化 401 兜底处理逻辑
- 健康检查轮询在 token 失效时自动停止，避免持续触发无效请求

## [2.9.1] - 2026-07-02

### Changed

- 请求日志筛选选项从 `reading`/`poster` 细化为模块分组：解读、海报、认证、用户、管理

## [2.8.0] - 2026-07-01

### Added

- 新增解读日志页面（ReadingLogsView），查看 AI 解读的详细日志记录
- 新增 ReadingLogTable 和 ReadingLogDetail 组件
- 新增 ReadingLogEntry/ReadingLogListResponse 类型定义
- 新增 fetchReadingLogs/fetchReadingLogById API 函数

### Changed

- 请求日志 LogTable 改为展示分阶段耗时（template_ms/resource_ms/screenshot_ms）和缓存状态
- LogDetail 移除解读相关字段，专注请求信息展示
- 路由 /logs 标题改为"请求日志"，新增 /reading-logs 路由
- 侧边栏菜单"日志"改名为"请求日志"，新增"解读日志"菜单项

## [2.7.0] - 2026-07-01

### Added

- 仪表盘 StatusCard 显示当前 Gemini 模型名称
- 仪表盘浏览器池状态补全 active/waiting 显示
- 健康检查页面新增当前模型卡片
- 健康检查页面新增错误详情和配额耗尽模型列表展示
- 指标页面新增耗时统计卡片（总耗时/模板/资源/截图）
- 指标页面新增分位数展示（P50/P95/P99）
- 指标页面新增样本统计卡片

### Changed

- HealthResponse 类型增加 model/detail/exhaustedModels 字段
- parsePrometheusMetrics 完善耗时和分位数解析
- HealthCard 组件支持 purple/gray 颜色

## [2.4.1] - 2026-06-28

### Fixed

- Gemini API 仪表盘和健康页区分四种状态显示（up/unconfigured/quota_exhausted/down）

## [2.4.0] - 2026-06-27

### Added

- 用户管理新增正常用户/已删除用户 Tab 切换视图
- 新增操作列: 解除邮箱绑定、逻辑删除用户、恢复已删除用户
- 删除确认弹窗 + Toast 操作反馈

### Fixed

- fetchUsers 增加 deleted 参数，支持查询已删除用户

## [2.3.4] - 2026-06-26

### Fixed

- 修复 HeadersInit 联合类型展开导致 TS7053 构建错误：改用 `Headers` API 安全合并 auth headers

## [2.3.3] - 2026-06-25

### Fixed

- 修复 `useAuth.login()` 返回值类型错误：`admin.value`（`AdminInfo | null`）赋值给 `AdminInfo` 导致 TS2322 编译报错，添加非空断言

## [2.3.2] - 2026-06-24

### Fixed

- 修复配置页面只读管理员可编辑配置的安全漏洞：ConfigView 编辑按钮增加 `admin?.role !== 'readonly'` 条件，只读角色仅可查看不可编辑

## [2.3.1] - 2026-06-24

### Fixed

- Sidebar 角色过滤逻辑修复：`admin?.role` → `admin.value?.role`，修复 Vue ref 未 `.value` 导致管理员管理菜单永远不显示的 bug

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
