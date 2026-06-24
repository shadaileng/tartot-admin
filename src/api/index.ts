import type { ServiceInfo, HealthResponse, LogListResponse, LogEntry, MetricsSnapshot, ConfigResponse, UserListResponse } from '@/types'
import { useAuth } from '@/composables/useAuth'

const BASE = import.meta.env.VITE_API_BASE_URL

function getAuthHeaders(): Record<string, string> {
  return useAuth().getAuthHeaders()
}

async function request<T>(path: string): Promise<T> {
  const headers = getAuthHeaders()
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function fetchServiceInfo(): Promise<ServiceInfo> {
  return request<ServiceInfo>('/')
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health')
}

export function fetchLogs(params: { page?: number; limit?: number; target?: string } = {}): Promise<LogListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.target) query.set('target', params.target)
  const qs = query.toString()
  return request<LogListResponse>(`/api/logs${qs ? `?${qs}` : ''}`)
}

export function fetchLogById(id: string): Promise<LogEntry> {
  return request<LogEntry>(`/api/logs/${id}`)
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
  return request<UserListResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`)
}

export function fetchConfig(): Promise<ConfigResponse> {
  return request<ConfigResponse>('/api/config')
}

export async function updateConfigItem(key: string, value: string): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders() }
  const res = await fetch(`${BASE}/api/config/${key}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ value }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}: ${res.statusText}`)
  }
}
