<script setup lang="ts">
import type { LogEntry } from '@/types'

defineProps<{
  logs: LogEntry[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', log: LogEntry): void
}>()

function statusColor(code: number): string {
  if (code < 300) return 'text-green-600 dark:text-green-400'
  if (code < 400) return 'text-blue-600 dark:text-blue-400'
  if (code < 500) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function truncate(text: string | null, len: number): string {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">时间</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">路径</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">状态</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">耗时</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">类型</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">问题</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">模型</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="7" class="py-8 text-center text-gray-400 dark:text-gray-500">加载中...</td>
        </tr>
        <tr v-else-if="logs.length === 0">
          <td colspan="7" class="py-8 text-center text-gray-400 dark:text-gray-500">暂无数据</td>
        </tr>
        <tr
          v-for="log in logs"
          :key="log.id"
          @click="emit('select', log)"
          class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        >
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {{ new Date(log.created_at).toLocaleString() }}
          </td>
          <td class="py-3 px-4 text-gray-900 dark:text-gray-100 font-mono text-xs">{{ log.path }}</td>
          <td class="py-3 px-4">
            <span class="font-medium" :class="statusColor(log.status_code)">{{ log.status_code }}</span>
          </td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400">{{ log.duration_ms }}ms</td>
          <td class="py-3 px-4">
            <span
              class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              :class="log.target === 'reading' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'"
            >{{ log.target }}</span>
          </td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{{ truncate(log.question, 30) }}</td>
          <td class="py-3 px-4 text-gray-500 dark:text-gray-500 text-xs">{{ log.model ?? '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
