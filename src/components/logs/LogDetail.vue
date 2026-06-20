<script setup lang="ts">
import type { LogEntry } from '@/types'

defineProps<{
  log: LogEntry | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function formatJson(json: string | null): string {
  if (!json) return '-'
  try {
    const obj = JSON.parse(json)
    return JSON.stringify(obj, null, 2)
  } catch {
    return json
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="log" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">日志详情</h3>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="overflow-auto p-6 space-y-4 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-gray-500 dark:text-gray-400">ID</span>
                <p class="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">{{ log.id }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">时间</span>
                <p class="text-gray-900 dark:text-gray-100">{{ new Date(log.created_at).toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">路径</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.method }} {{ log.path }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">状态码</span>
                <p
                  class="font-medium"
                  :class="log.status_code < 400 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >{{ log.status_code }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">耗时</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.duration_ms }}ms</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">IP</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.ip_address ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">模型</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.model ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">不完整</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.incomplete ? '是' : '否' }}</p>
              </div>
            </div>

            <div v-if="log.question">
              <span class="text-gray-500 dark:text-gray-400">问题</span>
              <p class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100">{{ log.question }}</p>
            </div>

            <div v-if="log.cards_json">
              <span class="text-gray-500 dark:text-gray-400">牌面数据</span>
              <pre class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 overflow-auto max-h-40">{{ formatJson(log.cards_json) }}</pre>
            </div>

            <div v-if="log.reading">
              <span class="text-gray-500 dark:text-gray-400">解读文本</span>
              <p class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-60 overflow-auto">{{ log.reading }}</p>
            </div>

            <div v-if="log.error_msg">
              <span class="text-gray-500 dark:text-gray-400">错误信息</span>
              <p class="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-xs">{{ log.error_msg }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
