import type { ServiceInfo, HealthResponse, LogListResponse, LogEntry, ReadingLogListResponse, ReadingLogEntry, MetricsSnapshot, ConfigResponse, UserListResponse, AdminListResponse, AdminEntry, CreateAdminRequest, UpdateAdminRequest, ResetPasswordRequest, ApiResponse, LevelDefinitionEntry, TaskDefinitionEntry, CreateTaskDefinitionRequest, UpdateTaskDefinitionRequest, UserStatsEntry, TrendResponse, AdminInviteListResponse, CheckinStatsResponse, FeedbackListResponse, FeedbackDetail, AuditLogListResponse, PageSectionsResponse } from '@/types'
import { useAuth } from '@/composables/useAuth'
import router from '@/router'

const BASE = import.meta.env.VITE_API_BASE_URL

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let isRedirectingToLogin = false

function getAuthHeaders(): Record<string, string> {
  return useAuth().getAuthHeaders()
}

function redirectToLogin() {
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true
  useAuth().logout()
  router.replace('/login')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const h = new Headers(getAuthHeaders())
  if (options?.headers) {
    new Headers(options.headers).forEach((v, k) => h.set(k, v))
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers: h })

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}))

    if (body.error === 'TOKEN_EXPIRED') {
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise
          h.set('Authorization', `Bearer ${newToken}`)
          const retryRes = await fetch(`${BASE}${path}`, { ...options, headers: h })
          if (retryRes.ok) return retryRes.json() as Promise<T>
        } catch {
          redirectToLogin()
        }
        throw new Error('登录已过期，请重新登录')
      }

      isRefreshing = true
      refreshPromise = useAuth().refreshAccessToken()

      try {
        const newToken = await refreshPromise
        h.set('Authorization', `Bearer ${newToken}`)
        const retryRes = await fetch(`${BASE}${path}`, { ...options, headers: h })
        if (!retryRes.ok) throw new Error('请求失败')
        return retryRes.json() as Promise<T>
      } catch {
        redirectToLogin()
        throw new Error('登录已过期，请重新登录')
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    }

    // 其他 401（如 UNAUTHORIZED "无效的 token"、REFRESH_EXPIRED）也跳转登录
    redirectToLogin()
    throw new Error(body.message || `HTTP ${res.status}`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function getRequest<T>(path: string): Promise<T> {
  return request<T>(path)
}

async function postRequest<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function putRequest<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function deleteRequest<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export function fetchServiceInfo(): Promise<ServiceInfo> {
  return getRequest<ServiceInfo>('/')
}

export function fetchHealth(): Promise<HealthResponse> {
  return getRequest<HealthResponse>('/api/health')
}

export function fetchLogs(params: { page?: number; limit?: number; target?: string } = {}): Promise<LogListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.target) query.set('target', params.target)
  const qs = query.toString()
  return getRequest<LogListResponse>(`/api/logs${qs ? `?${qs}` : ''}`)
}

export function fetchLogById(id: string): Promise<LogEntry> {
  return getRequest<LogEntry>(`/api/logs/${id}`)
}

export function fetchReadingLogs(params: { page?: number; limit?: number } = {}): Promise<ReadingLogListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return getRequest<ReadingLogListResponse>(`/api/reading-logs${qs ? `?${qs}` : ''}`)
}

export function fetchReadingLogById(id: string): Promise<ReadingLogEntry> {
  return getRequest<ReadingLogEntry>(`/api/reading-logs/${id}`)
}

export async function fetchMetricsRaw(): Promise<string> {
  const res = await fetch(`${BASE}/api/metrics`)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.text()
}

export function parsePrometheusMetrics(raw: string): Partial<MetricsSnapshot> {
  const result: Record<string, number> = {}
  const lines = raw.split('\n')
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue
    // 解析带 label 的指标：request_duration_ms{quantile="0.5"} 11
    const matchWithLabel = line.match(/^(\w+)\{[^}]*quantile="([^"]+)"\}\s+([\d.]+)/)
    if (matchWithLabel) {
      const metricName = matchWithLabel[1]
      const quantile = matchWithLabel[2]
      const value = parseFloat(matchWithLabel[3])
      const key = `${metricName}_p${quantile.replace('.', '')}`
      result[key] = value
      continue
    }
    // 解析带 label 的按 target 分组指标：request_by_target_total{target="reading"} 1
    const matchWithTarget = line.match(/^(\w+)\{target="([^"]+)"\}\s+([\d.]+)/)
    if (matchWithTarget) {
      const metricName = matchWithTarget[1]
      const target = matchWithTarget[2]
      const value = parseFloat(matchWithTarget[3])
      const key = `${metricName}_${target}`
      result[key] = value
      continue
    }
    // 解析普通指标：request_requests_total 42
    const match = line.match(/^(\w+)\s+([\d.]+)/)
    if (match) {
      result[match[1]] = parseFloat(match[2])
    }
  }
  return {
    totalRequests: result['request_requests_total'] ?? 0,
    cacheHits: result['request_cache_hits_total'] ?? 0,
    cacheMisses: result['request_cache_misses_total'] ?? 0,
    cacheHitRate: result['request_cache_hit_rate'] ?? 0,
    errorCount: result['request_errors_total'] ?? 0,
    avgTotalMs: result['request_duration_ms_count'] > 0
      ? (result['request_duration_ms_sum'] ?? 0) / result['request_duration_ms_count']
      : 0,
    avgTemplateMs: result['request_template_duration_ms'] ?? 0,
    avgResourceMs: result['request_resource_duration_ms'] ?? 0,
    avgScreenshotMs: result['request_screenshot_duration_ms'] ?? 0,
    totalP50: result['request_duration_ms_p50'] ?? 0,
    totalP95: result['request_duration_ms_p95'] ?? 0,
    totalP99: result['request_duration_ms_p99'] ?? 0,
    templateP50: 0,
    templateP95: 0,
    templateP99: 0,
    resourceP50: 0,
    resourceP95: 0,
    resourceP99: 0,
    screenshotP50: 0,
    screenshotP95: 0,
    screenshotP99: 0,
    sampleCount: result['request_requests_total'] ?? 0,
    nonCacheSampleCount: result['request_cache_misses_total'] ?? 0,
  }
}

export function fetchUsers(params: {
  page?: number
  limit?: number
  keyword?: string
  deleted?: boolean
} = {}): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.deleted) query.set('deleted', 'true')
  const qs = query.toString()
  return getRequest<UserListResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`)
}

export function unbindEmail(userId: string): Promise<{ message: string }> {
  return putRequest<{ message: string }>(`/api/admin/users/${userId}/unbind-email`, {})
}

export function deleteUser(userId: string): Promise<{ message: string }> {
  return deleteRequest<{ message: string }>(`/api/admin/users/${userId}`)
}

export function restoreUser(userId: string): Promise<{ message: string }> {
  return putRequest<{ message: string }>(`/api/admin/users/${userId}/restore`, {})
}

export function fetchConfig(): Promise<ConfigResponse> {
  return getRequest<ConfigResponse>('/api/config')
}

export async function updateConfigItem(key: string, value: string): Promise<void> {
  await putRequest(`/api/config/${key}`, { value })
}

// ========== 管理员 CRUD API ==========

export async function fetchAdmins(params: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<ApiResponse<AdminListResponse>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return getRequest<ApiResponse<AdminListResponse>>(`/api/admin/admins${qs ? `?${qs}` : ''}`)
}

export function createAdmin(data: CreateAdminRequest): Promise<ApiResponse<AdminEntry>> {
  return postRequest<ApiResponse<AdminEntry>>('/api/admin/admins', data)
}

export function updateAdmin(id: string, data: UpdateAdminRequest): Promise<ApiResponse<null>> {
  return putRequest<ApiResponse<null>>(`/api/admin/admins/${id}`, data)
}

export function deleteAdmin(id: string): Promise<ApiResponse<null>> {
  return deleteRequest<ApiResponse<null>>(`/api/admin/admins/${id}`)
}

export function resetAdminPassword(id: string, data: ResetPasswordRequest): Promise<ApiResponse<null>> {
  return postRequest<ApiResponse<null>>(`/api/admin/admins/${id}/reset-password`, data)
}

// ========== 等级管理 API ==========

export function fetchLevelDefinitions(): Promise<{ levels: LevelDefinitionEntry[] }> {
  return getRequest<{ levels: LevelDefinitionEntry[] }>('/api/levels')
}

export function updateLevelDefinition(level: number, data: Partial<LevelDefinitionEntry>): Promise<void> {
  return putRequest<void>(`/api/admin/level-definitions/${level}`, data)
}

// ========== 任务管理 API ==========

export function fetchTaskDefinitions(): Promise<{ tasks: TaskDefinitionEntry[] }> {
  return getRequest<{ tasks: TaskDefinitionEntry[] }>('/api/admin/task-definitions')
}

export function createTaskDefinition(data: CreateTaskDefinitionRequest): Promise<void> {
  return postRequest<void>('/api/admin/task-definitions', data)
}

export function updateTaskDefinition(id: string, data: UpdateTaskDefinitionRequest): Promise<void> {
  return putRequest<void>(`/api/admin/task-definitions/${id}`, data)
}

// ========== 用户统计 API ==========

export function fetchUserStatsList(params: {
  page?: number
  limit?: number
  keyword?: string
} = {}): Promise<{ total: number; page: number; limit: number; data: UserStatsEntry[] }> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.keyword) query.set('keyword', params.keyword)
  const qs = query.toString()
  return getRequest(`/api/admin/user-stats${qs ? `?${qs}` : ''}`)
}

export function updateUserPoints(userId: string, delta: number): Promise<void> {
  return putRequest<void>(`/api/admin/users/${userId}/points`, { delta })
}

// ========== 趋势统计 API ==========

export function fetchTrends(days: number = 30): Promise<TrendResponse> {
  return getRequest<TrendResponse>(`/api/admin/stats/trends?days=${days}`)
}

// ========== 邀请记录管理 API ==========

export function fetchAdminInviteRecords(params: {
  page?: number
  limit?: number
  status?: string
  keyword?: string
} = {}): Promise<AdminInviteListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.status) query.set('status', params.status)
  if (params.keyword) query.set('keyword', params.keyword)
  const qs = query.toString()
  return getRequest<AdminInviteListResponse>(`/api/admin/invite-records${qs ? `?${qs}` : ''}`)
}

export function completeInviteRecord(id: string): Promise<void> {
  return putRequest<void>(`/api/admin/invite-records/${id}/complete`, {})
}

export function deleteInviteRecord(id: string): Promise<void> {
  return deleteRequest<void>(`/api/admin/invite-records/${id}`)
}

// ========== 签到统计 API ==========

export function fetchCheckinStats(params: {
  detail?: boolean
  page?: number
  limit?: number
} = {}): Promise<CheckinStatsResponse> {
  const query = new URLSearchParams()
  if (params.detail) query.set('detail', '1')
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return getRequest<CheckinStatsResponse>(`/api/admin/checkin-stats${qs ? `?${qs}` : ''}`)
}

// ========== 用户数据维护 API ==========

export function resetUserQuota(userId: string): Promise<void> {
  return putRequest<void>(`/api/admin/users/${userId}/reset-quota`, {})
}

export function clearUserInvite(userId: string): Promise<void> {
  return putRequest<void>(`/api/admin/users/${userId}/clear-invite`, {})
}

// ========== 意见反馈 API ==========

export function fetchFeedbackList(params: {
  page?: number
  limit?: number
  keyword?: string
  status?: string
} = {}): Promise<FeedbackListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.status) query.set('status', params.status)
  const qs = query.toString()
  return getRequest<FeedbackListResponse>(`/api/admin/feedback${qs ? `?${qs}` : ''}`)
}

export function fetchFeedbackDetail(id: string): Promise<FeedbackDetail> {
  return getRequest<FeedbackDetail>(`/api/admin/feedback/${id}`)
}

export function replyFeedback(id: string, reply: string): Promise<void> {
  return postRequest<void>(`/api/admin/feedback/${id}/reply`, { reply })
}

export function updateFeedbackStatus(id: string, status: string): Promise<void> {
  return putRequest<void>(`/api/admin/feedback/${id}/status`, { status })
}

// ========== 审计日志 API ==========

export function fetchAuditLogs(params: {
  page?: number
  limit?: number
  actorType?: string
  action?: string
  targetType?: string
  startDate?: string
  endDate?: string
} = {}): Promise<AuditLogListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.actorType) query.set('actorType', params.actorType)
  if (params.action) query.set('action', params.action)
  if (params.targetType) query.set('targetType', params.targetType)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  const qs = query.toString()
  return getRequest<AuditLogListResponse>(`/api/admin/audit-logs${qs ? `?${qs}` : ''}`)
}

export function cleanAuditLogs(retentionDays?: number): Promise<{ message: string; deleted: number; retentionDays: number }> {
  return postRequest<{ message: string; deleted: number; retentionDays: number }>('/api/admin/audit-logs/clean', { retentionDays })
}

// ========== 菜单 API ==========

export function fetchMyMenus(): Promise<{ menus: import('@/types').MenuTreeItem[] }> {
  return getRequest<{ menus: import('@/types').MenuTreeItem[] }>('/api/admin/menus/my')
}

export function fetchAllMenus(): Promise<{ menus: import('@/types').MenuItem[] }> {
  return getRequest<{ menus: import('@/types').MenuItem[] }>('/api/admin/menus')
}

export function createMenu(data: import('@/types').CreateMenuRequest): Promise<{ id: string }> {
  return postRequest<{ id: string }>('/api/admin/menus', data)
}

export function updateMenu(id: string, data: import('@/types').UpdateMenuRequest): Promise<void> {
  return putRequest<void>(`/api/admin/menus/${id}`, data)
}

export function deleteMenu(id: string): Promise<void> {
  return deleteRequest<void>(`/api/admin/menus/${id}`)
}

export function fetchRoleMenus(role: string): Promise<{ menuIds: string[] }> {
  return getRequest<{ menuIds: string[] }>(`/api/admin/menus/role/${role}`)
}

export function updateRoleMenus(role: string, menuIds: string[]): Promise<void> {
  return putRequest<void>(`/api/admin/menus/role/${role}`, { menuIds })
}

// ========== 页面管理 API ==========

export function fetchPageSections(): Promise<PageSectionsResponse> {
  return getRequest<PageSectionsResponse>('/api/admin/page-sections')
}

export function updatePageSection(id: string, visible: boolean): Promise<void> {
  return putRequest<void>(`/api/admin/page-sections/${id}`, { visible: visible ? 1 : 0 })
}
