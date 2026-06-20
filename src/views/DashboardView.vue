<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ServiceInfo, HealthResponse } from '@/types'
import { fetchServiceInfo, fetchHealth } from '@/api'
import StatusCard from '@/components/dashboard/StatusCard.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const info = ref<ServiceInfo | null>(null)
const health = ref<HealthResponse | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const [i, h] = await Promise.all([fetchServiceInfo(), fetchHealth()])
    info.value = i
    health.value = h
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusCard :info="info" :health="health" />

        <div class="grid grid-cols-2 gap-4">
          <MetricCard
            label="总请求数"
            :value="health?.metrics.totalRequests ?? 0"
            color="indigo"
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
          <MetricCard
            label="错误数"
            :value="health?.metrics.errors ?? 0"
            color="red"
            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
          <MetricCard
            label="平均耗时"
            :value="`${((health?.metrics.avgTotalMs ?? 0)).toFixed(0)}ms`"
            color="blue"
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <MetricCard
            label="缓存命中率"
            :value="`${((health?.cache.hitRate ?? 0) * 100).toFixed(1)}%`"
            color="green"
            icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </div>
      </div>

      <div v-if="health" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">缓存使用</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ health.cache.size }} / {{ health.cache.maxSize }}</p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">浏览器池</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ health.pool.available }} 可用 / {{ health.pool.maxPages }} 最大</p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">API 端点</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ info?.endpoints ? Object.keys(info.endpoints).length : 0 }} 个</p>
        </div>
      </div>
    </template>
  </div>
</template>
