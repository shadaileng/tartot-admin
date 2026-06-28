<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { CheckinStatsResponse } from '@/types'
import { fetchCheckinStats } from '@/api'

const stats = ref<CheckinStatsResponse | null>(null)
const records = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

async function doLoad() {
  loading.value = true
  try {
    const res = await fetchCheckinStats({ detail: true, page: page.value, limit: limit.value })
    stats.value = res
    records.value = res.data || []
    total.value = res.total || 0
  } catch {}
  loading.value = false
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

watch(page, doLoad, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">签到统计</h2>

    <div v-if="loading && !stats" class="text-center py-12 text-gray-500">加载中...</div>

    <template v-if="stats">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.todayCheckins }}</div>
          <div class="text-sm text-gray-500">今日签到</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">累计签到</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.avgPoints }}</div>
          <div class="text-sm text-gray-500">平均获得积分</div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">签到记录</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">用户</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">签到日期</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">积分</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">连续奖励</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in records" :key="row.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ row.nickname || '匿名' }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ row.checkin_date }}</td>
                <td class="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">{{ row.points_earned }}</td>
                <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">+{{ row.streak_bonus }}</td>
                <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.created_at) }}</td>
              </tr>
              <tr v-if="records.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-500">暂无签到记录</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-500 dark:text-gray-400">第 {{ page }} / {{ totalPages }} 页</span>
          <div class="flex gap-2">
            <button :disabled="page <= 1" @click="page--"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">上一页</button>
            <button :disabled="page >= totalPages" @click="page++"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">下一页</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
