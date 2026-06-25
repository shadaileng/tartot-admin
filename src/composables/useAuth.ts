import { ref, computed, readonly } from 'vue'

interface AdminInfo {
  id: string
  username: string
  displayName: string
  role: string
  mustChangePassword: boolean
}

const TOKEN_KEY = 'admin_token'
const ADMIN_KEY = 'admin_info'

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const admin = ref<AdminInfo | null>(loadAdminInfo())

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
  const isLoggedIn = computed(() => !!token.value)

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

    token.value = body.token
    admin.value = {
      ...body.admin,
      mustChangePassword: body.mustChangePassword === true,
    }
    localStorage.setItem(TOKEN_KEY, body.token)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))

    return admin.value!
  }

  function logout(): void {
    token.value = null
    admin.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  function getAuthHeaders(): Record<string, string> {
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
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

    // 改密成功后更新 mustChangePassword 标记
    if (admin.value) {
      admin.value = { ...admin.value, mustChangePassword: false }
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin.value))
    }

    // 改密后登出，要求用户重新登录
    logout()
  }

  return {
    isLoggedIn,
    admin: readonly(admin),
    token: readonly(token),
    login,
    logout,
    changePassword,
    getAuthHeaders,
  }
}
