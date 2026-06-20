<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHealth } from '@/composables/useHealth'

const { data: health } = useHealth()

const configItems = computed(() => [
  { key: 'port', label: 'PORT', value: '3000 (HF: 7860)', category: '服务' },
  { key: 'nodeEnv', label: 'NODE_ENV', value: 'development', category: '服务' },
  { key: 'geminiApiKey', label: 'GEMINI_API_KEY', value: health.value?.gemini === 'up' ? 'sk-...已配置' : '未配置', category: 'AI' },
  { key: 'apiKey', label: 'API_KEY', value: '未设置', category: '安全' },
  { key: 'corsOrigin', label: 'CORS_ORIGIN', value: '*', category: '安全' },
  { key: 'dbPath', label: 'DB_PATH', value: './data/tarot.db', category: '数据' },
  { key: 'logRetention', label: 'LOG_RETENTION_DAYS', value: '30', category: '数据' },
  { key: 'cacheMaxSize', label: 'CACHE_MAX_SIZE', value: '100', category: '缓存' },
  { key: 'cacheTtl', label: 'CACHE_TTL_SECONDS', value: '3600', category: '缓存' },
  { key: 'posterWidth', label: 'POSTER_WIDTH', value: '750', category: '海报' },
  { key: 'posterHeight', label: 'POSTER_HEIGHT', value: '1334', category: '海报' },
  { key: 'poolMaxPages', label: 'POOL_MAX_PAGES', value: '4', category: '浏览器池' },
  { key: 'poolTimeout', label: 'POOL_ACQUIRE_TIMEOUT_MS', value: '30000', category: '浏览器池' },
])

const categories = computed(() => {
  const map = new Map<string, typeof configItems.value>()
  for (const item of configItems.value) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return Array.from(map.entries())
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">环境变量配置</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">以下为后端默认配置值（实际值以 .env 文件为准）</p>
      </div>

      <div class="p-6 space-y-6">
        <div v-for="[category, items] in categories" :key="category">
          <h4 class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{{ category }}</h4>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="item in items" :key="item.key" class="flex items-center justify-between px-4 py-3">
              <code class="text-sm font-mono text-indigo-600 dark:text-indigo-400">{{ item.label }}</code>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
