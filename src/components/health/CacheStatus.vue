<script setup lang="ts">
import type { HealthResponse } from '@/types'

defineProps<{
  data: HealthResponse
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">缓存状态</h3>
    <div class="space-y-4">
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600 dark:text-gray-400">使用量</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ data.cache.size }} / {{ data.cache.maxSize }}</span>
        </div>
        <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-indigo-500 rounded-full transition-all"
            :style="{ width: `${(data.cache.size / data.cache.maxSize) * 100}%` }"
          />
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">命中率</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ (data.cache.hitRate * 100).toFixed(1) }}%
        </span>
      </div>
    </div>
  </div>
</template>
