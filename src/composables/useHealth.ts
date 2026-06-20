import { ref, onMounted, onUnmounted } from 'vue'
import type { HealthResponse } from '@/types'
import { fetchHealth } from '@/api'

export function useHealth(intervalMs = 10000) {
  const data = ref<HealthResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(true)
  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      data.value = await fetchHealth()
      error.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    refresh()
    timer = setInterval(refresh, intervalMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { data, error, loading, refresh }
}
