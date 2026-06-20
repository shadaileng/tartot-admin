<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LogEntry, LogListResponse } from '@/types'
import { fetchLogs } from '@/api'
import LogFilter from '@/components/logs/LogFilter.vue'
import LogTable from '@/components/logs/LogTable.vue'
import LogDetail from '@/components/logs/LogDetail.vue'

const target = ref('')
const page = ref(1)
const limit = ref(20)
const data = ref<LogListResponse | null>(null)
const loading = ref(true)
const selectedLog = ref<LogEntry | null>(null)

async function load() {
  loading.value = true
  try {
    data.value = await fetchLogs({ page: page.value, limit: limit.value, target: target.value || undefined })
  } finally {
    loading.value = false
  }
}

watch([target, page], load, { immediate: true })

function selectLog(log: LogEntry) {
  selectedLog.value = log
}
</script>

<template>
  <div class="space-y-4">
    <LogFilter
      :target="target"
      :page="page"
      :total="data?.total ?? 0"
      :limit="limit"
      @update:target="target = $event"
      @update:page="page = $event"
    />

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <LogTable :logs="data?.data ?? []" :loading="loading" @select="selectLog" />
    </div>

    <div v-if="data" class="text-xs text-gray-400 dark:text-gray-500 text-right">
      共 {{ data.total }} 条记录
    </div>

    <LogDetail :log="selectedLog" @close="selectedLog = null" />
  </div>
</template>
