<script setup lang="ts">
import type { ServiceInfo, HealthResponse } from '@/types'

defineProps<{
  info: ServiceInfo | null
  health: HealthResponse | null
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">服务状态</h3>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">服务名</span>
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ info?.service ?? '-' }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">版本</span>
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">v{{ info?.version ?? '-' }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">状态</span>
        <span
          class="inline-flex items-center gap-1 text-sm font-medium"
          :class="health?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'" />
          {{ health?.status === 'ok' ? '运行中' : '异常' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">Gemini API</span>
        <span
          class="text-sm font-medium"
          :class="health?.gemini === 'up' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'"
        >
          {{ health?.gemini === 'up' ? '已配置' : '未配置' }}
        </span>
      </div>
    </div>
  </div>
</template>
