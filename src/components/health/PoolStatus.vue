<script setup lang="ts">
import type { HealthResponse } from '@/types'

defineProps<{
  data: HealthResponse
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">浏览器池</h3>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">可用</p>
        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ data.pool.available }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">活跃</p>
        <p class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ data.pool.active }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">等待</p>
        <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ data.pool.waiting }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">最大</p>
        <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ data.pool.maxPages }}</p>
      </div>
    </div>
  </div>
</template>
