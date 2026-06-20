<script setup lang="ts">
import { useHealth } from '@/composables/useHealth'
import HealthCard from '@/components/health/HealthCard.vue'
import CacheStatus from '@/components/health/CacheStatus.vue'
import PoolStatus from '@/components/health/PoolStatus.vue'

const { data, error, loading } = useHealth(5000)
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading && !data" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
      获取健康数据失败: {{ error }}
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard label="服务状态" :value="data.status === 'ok' ? '正常' : '异常'" :color="data.status === 'ok' ? 'green' : 'red'" />
        <HealthCard label="Gemini API" :value="data.gemini === 'up' ? '已配置' : '未配置'" :color="data.gemini === 'up' ? 'green' : 'yellow'" />
        <HealthCard label="总请求" :value="data.metrics.totalRequests" color="indigo" />
        <HealthCard label="平均耗时" :value="`${data.metrics.avgTotalMs}ms`" color="blue" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CacheStatus :data="data" />
        <PoolStatus :data="data" />
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">指标概览</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ data.metrics.totalRequests }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">总请求</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ data.metrics.errors }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">错误数</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ data.metrics.avgTotalMs }}ms</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">平均耗时</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ (data.cache.hitRate * 100).toFixed(1) }}%</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">缓存命中率</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
