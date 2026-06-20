# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
