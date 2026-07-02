import { ref, computed, readonly } from 'vue'

interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
  mustChangePassword: boolean
}

const ACCESS_TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'
const ADMIN_KEY = 'admin_info'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function loadStoredTokens(): { access: string | null; refresh: string | null } {
  let access = localStorage.getItem(ACCESS_TOKEN_KEY)
  let refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  if ((access && isTokenExpired(access)) || (refresh && isTokenExpired(refresh))) {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
    access = null
    refresh = null
  }
  return { access, refresh }
}

const stored = loadStoredTokens()
const accessToken = ref<string | null>(stored.access)
const refreshToken = ref<string | null>(stored.refresh)
const admin = ref<AdminInfo | null>(stored.access ? loadAdminInfo() : null)

function loadAdminInfo(): AdminInfo | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || ''
}

export function useAuth() {
  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(username: string, password: string): Promise<AdminInfo> {
    const base = getBaseUrl()
    const res = await fetch(`${base}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '登录失败')
    }

    accessToken.value = body.accessToken
    refreshToken.value = body.refreshToken
    admin.value = {
      ...body.admin,
      mustChangePassword: body.mustChangePassword === true,
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, body.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, body.refreshToken)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))

    return admin.value!
  }

  function logout(): void {
    accessToken.value = null
    refreshToken.value = null
    admin.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  function getAuthHeaders(): Record<string, string> {
    if (!accessToken.value) return {}
    return { Authorization: `Bearer ${accessToken.value}` }
  }

  async function refreshAccessToken(): Promise<string> {
    const base = getBaseUrl()
    const res = await fetch(`${base}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '刷新失败')
    }

    accessToken.value = body.accessToken
    refreshToken.value = body.refreshToken
    localStorage.setItem(ACCESS_TOKEN_KEY, body.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, body.refreshToken)

    return body.accessToken
  }

  async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const base = getBaseUrl()
    const headers = getAuthHeaders()
    const res = await fetch(`${base}/admin/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ oldPassword, newPassword }),
    })

    const body = await res.json()

    if (!res.ok) {
      throw new Error(body.message || '修改密码失败')
    }

    if (admin.value) {
      admin.value = { ...admin.value, mustChangePassword: false }
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))
    }

    logout()
  }

  return {
    isLoggedIn,
    admin: readonly(admin),
    token: readonly(accessToken),
    login,
    logout,
    refreshAccessToken,
    changePassword,
    getAuthHeaders,
  }
}
