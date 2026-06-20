# 后端 API 对接文档

> 本文档描述 tarot-admin 前端与 tarot-backend 后端的 API 对接方案。

---

## 一、API 基础地址

| 环境 | 地址 |
|------|------|
| 开发环境 | Vite proxy → `http://localhost:3000` |
| 生产环境 | `VITE_API_BASE_URL` 环境变量 |

---

## 二、API 端点清单

### GET / — 服务信息

```typescript
// 响应类型: ServiceInfo
{
  service: "tarot-backend"
  version: "1.1.4"
  status: "running"
  endpoints: {
    reading: "POST /reading"
    poster: "POST /poster"
    health: "GET /health"
    metrics: "GET /metrics"
    logs: "GET /logs"
  }
}
```

**使用页面**: Dashboard

---

### GET /health — 健康检查

```typescript
// 响应类型: HealthResponse
{
  status: "ok"
  worker: "up"
  gemini: "up" | "unconfigured"
  cache: {
    size: number      // 当前缓存条目数
    maxSize: number   // 最大缓存容量
    hitRate: number   // 缓存命中率 (0-1)
  }
  pool: {
    available: number // 可用 Page 数
    active: number    // 活跃 Page 数
    waiting: number   // 等待中的请求数
    maxPages: number  // 最大 Page 数
  }
  metrics: {
    totalRequests: number // 总请求数
    errors: number        // 错误数
    avgTotalMs: number    // 平均耗时 (ms)
  }
}
```

**使用页面**: Dashboard, Health, Config

---

### GET /logs — 日志查询

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 50 | 每页条数（最大 200） |
| `target` | string | 全部 | 过滤: `reading` 或 `poster` |

```typescript
// 响应类型: LogListResponse
{
  total: number
  page: number
  limit: number
  data: LogEntry[]
}

// LogEntry
{
  id: string
  created_at: string     // ISO 8601
  method: string
  path: string
  target: string         // "reading" | "poster"
  status_code: number
  duration_ms: number
  ip_address: string | null
  question: string | null
  cards_json: string | null
  reading: string | null
  model: string | null
  incomplete: number     // 0 | 1
  is_error: number       // 0 | 1
  error_msg: string | null
}
```

**使用页面**: Logs

---

### GET /logs/:id — 日志详情

返回单个 `LogEntry` 对象。

**使用页面**: Logs（弹窗详情）

---

### GET /metrics — Prometheus 指标

返回 `text/plain` 格式的 Prometheus 指标文本。

关键指标:
- `poster_requests_total` — 总请求数
- `poster_cache_hits_total` — 缓存命中数
- `poster_cache_misses_total` — 缓存未命中数
- `poster_cache_hit_rate` — 缓存命中率
- `poster_errors_total` — 错误数

**使用页面**: Metrics

---

## 三、前端 API 封装

文件: `src/api/index.ts`

```typescript
// 封装函数
fetchServiceInfo()     // GET /
fetchHealth()          // GET /health
fetchLogs(params)      // GET /logs?page=&limit=&target=
fetchLogById(id)       // GET /logs/:id
fetchMetricsRaw()      // GET /metrics (返回原始文本)
parsePrometheusMetrics(raw)  // 解析 Prometheus 文本为对象
```

所有请求通过 `fetch` 原生 API 实现，`VITE_API_BASE_URL` 为空时由 Vite proxy 处理。

---

## 四、错误处理

- HTTP 状态码非 2xx 时抛出 Error
- 前端通过 `try/catch` 捕获，在 UI 中展示错误提示
- 健康检查支持自动轮询（5-10 秒间隔）
