export interface ServiceInfo {
  service: string
  version: string
  status: string
  endpoints: Record<string, string>
}

export interface HealthResponse {
  status: string
  worker: string
  gemini: string
  cache: {
    size: number
    maxSize: number
    hitRate: number
  }
  pool: {
    available: number
    active: number
    waiting: number
    maxPages: number
  }
  metrics: {
    totalRequests: number
    errors: number
    avgTotalMs: number
  }
}

export interface LogEntry {
  id: string
  created_at: string
  method: string
  path: string
  target: string
  status_code: number
  duration_ms: number
  ip_address: string | null
  question: string | null
  cards_json: string | null
  reading: string | null
  model: string | null
  incomplete: number
  is_error: number
  error_msg: string | null
  // 用户信息（来自后端 JOIN 查询）
  user_id: string | null
  user_nickname: string | null
  user_email: string | null
  user_avatar: string | null
  login_type: string | null
}

export interface LogListResponse {
  total: number
  page: number
  limit: number
  data: LogEntry[]
}

export interface MetricsSnapshot {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  errorCount: number
  avgTotalMs: number
  avgTemplateMs: number
  avgResourceMs: number
  avgScreenshotMs: number
  totalP50: number
  totalP95: number
  totalP99: number
  templateP50: number
  templateP95: number
  templateP99: number
  resourceP50: number
  resourceP95: number
  resourceP99: number
  screenshotP50: number
  screenshotP95: number
  screenshotP99: number
  sampleCount: number
  nonCacheSampleCount: number
}

export interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
  mustChangePassword: boolean
}

export interface AuthResponse {
  token: string
  admin: AdminInfo
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ConfigItem {
  key: string
  label: string
  value: string
  source: 'env' | 'user'
  editable: boolean
  type: 'string' | 'number'
}

export interface ConfigGroup {
  name: string
  items: ConfigItem[]
}

export interface ConfigResponse {
  groups: ConfigGroup[]
}

export interface UserEntry {
  id: string
  openid: string
  nickname: string
  avatar_url: string | null
  email: string | null
  phone: string | null
  created_at: string
  last_login_at: string | null
  request_count: number
  last_request_at: string | null
}

export interface UserListResponse {
  total: number
  page: number
  limit: number
  data: UserEntry[]
}
