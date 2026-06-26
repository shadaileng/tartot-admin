import type { ServiceInfo, HealthResponse, LogListResponse, LogEntry, MetricsSnapshot, ConfigResponse, UserListResponse, AdminListResponse, AdminEntry, CreateAdminRequest, UpdateAdminRequest, ResetPasswordRequest, ApiResponse } from '@/types'
import { useAuth } from '@/composables/useAuth'

const BASE = import.meta.env.VITE_API_BASE_URL

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

function getAuthHeaders(): Record<string, string> {
  return useAuth().getAuthHeaders()
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers || {}) }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}))

    if (body.error === 'TOKEN_EXPIRED') {
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise
          headers['Authorization'] = `Bearer ${newToken}`
          const retryRes = await fetch(`${BASE}${path}`, { ...options, headers })
          if (retryRes.ok) return retryRes.json() as Promise<T>
        } catch {
          useAuth().logout()
          window.location.href = '/login'
          throw new Error('登录已过期，请重新登录')
        }
      }

      isRefreshing = true
      refreshPromise = useAuth().refreshAccessToken()

      try {
        const newToken = await refreshPromise
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(`${BASE}${path}`, { ...options, headers })
        if (!retryRes.ok) throw new Error('请求失败')
        return retryRes.json() as Promise<T>
      } catch {
        useAuth().logout()
        window.location.href = '/login'
        throw new Error('登录已过期，请重新登录')
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    }

    if (body.error === 'REFRESH_EXPIRED') {
      useAuth().logout()
      window.location.href = '/login'
    }

    throw new Error(body.message || `HTTP ${res.status}`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `HTTP ${res.status}: ${res.statusText}`)
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
    const match = line.match(/^(\w+)\{?\}?\s+([\d.]+)/)
    if (match) {
      result[match[1]] = parseFloat(match[2])
    }
  }
  return {
    totalRequests: result['poster_requests_total'] ?? 0,
    cacheHits: result['poster_cache_hits_total'] ?? 0,
    cacheMisses: result['poster_cache_misses_total'] ?? 0,
    cacheHitRate: result['poster_cache_hit_rate'] ?? 0,
    errorCount: result['poster_errors_total'] ?? 0,
  }
}

export function fetchUsers(params: {
  page?: number
  limit?: number
  keyword?: string
} = {}): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.keyword) query.set('keyword', params.keyword)
  const qs = query.toString()
  return getRequest<UserListResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`)
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
