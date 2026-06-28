<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { TrendResponse } from '@/types'
import { fetchTrends } from '@/api'

const data = ref<TrendResponse | null>(null)
const loading = ref(true)
const days = ref(30)
const visibleLines = ref<Record<LineKey, boolean>>({ registration: true, checkin: true, reading: true, invite: true })

async function loadTrends() {
  loading.value = true
  try {
    data.value = await fetchTrends(days.value)
  } catch {}
  loading.value = false
}

function toggleLine(key: LineKey) {
  visibleLines.value[key] = !visibleLines.value[key]
}

const lineLabels: Record<string, string> = { registration: '注册', checkin: '签到', reading: '占卜', invite: '邀请' }
const lineColors: Record<string, string> = { registration: '#6366f1', checkin: '#10b981', reading: '#f59e0b', invite: '#ef4444' }
const lineKeys = ['registration', 'checkin', 'reading', 'invite'] as const
type LineKey = typeof lineKeys[number]

function getTrendPoints(key: LineKey): { date: string; count: number }[] {
  return data.value ? data.value[key] : []
}

function maxCount(key: LineKey): number {
  const pts = getTrendPoints(key)
  return Math.max(...pts.map(p => p.count), 1)
}

function buildPoints(key: LineKey): string {
  const pts = getTrendPoints(key)
  const max = maxCount(key)
  return pts.map((p, i) => `${(i / (pts.length - 1 || 1)) * 1000},${200 - (p.count / max) * 180}`).join(' ')
}

function formatDate(d: string) { return d.slice(5, 10) }

onMounted(loadTrends)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">趋势统计</h2>
      <select v-model.number="days" @change="loadTrends"
        class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <option :value="7">近 7 天</option>
        <option :value="30">近 30 天</option>
        <option :value="90">近 90 天</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <template v-if="!loading && data">
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ data.summary.totalUsers }}</div>
          <div class="text-sm text-gray-500">总用户</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ data.summary.todayCheckins }}</div>
          <div class="text-sm text-gray-500">今日签到</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ data.summary.totalReadings }}</div>
          <div class="text-sm text-gray-500">总占卜</div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ data.summary.totalInvites }}</div>
          <div class="text-sm text-gray-500">总邀请</div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-4 mb-4">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">趋势图</span>
          <button v-for="key in lineKeys" :key="key" @click="toggleLine(key)"
            class="px-3 py-1 text-xs rounded-full font-medium transition-colors"
            :class="visibleLines[key] ? 'text-white' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'"
            :style="visibleLines[key] ? { backgroundColor: lineColors[key] } : {}">
            {{ lineLabels[key] }}
          </button>
        </div>

        <div class="relative h-64">
          <svg viewBox="0 0 1000 200" class="w-full h-full" preserveAspectRatio="none">
            <polyline v-if="visibleLines.registration" :points="buildPoints('registration')" :stroke="lineColors.registration" fill="none" stroke-width="2" stroke-linejoin="round" />
            <polyline v-if="visibleLines.checkin" :points="buildPoints('checkin')" :stroke="lineColors.checkin" fill="none" stroke-width="2" stroke-linejoin="round" />
            <polyline v-if="visibleLines.reading" :points="buildPoints('reading')" :stroke="lineColors.reading" fill="none" stroke-width="2" stroke-linejoin="round" />
            <polyline v-if="visibleLines.invite" :points="buildPoints('invite')" :stroke="lineColors.invite" fill="none" stroke-width="2" stroke-linejoin="round" />
          </svg>
        </div>
        <div v-if="data.registration.length > 0" class="flex justify-between text-xs text-gray-400 mt-2">
          <span>{{ formatDate(data.registration[0].date) }}</span>
          <span>{{ formatDate(data.registration[Math.floor(data.registration.length / 2)].date) }}</span>
          <span>{{ formatDate(data.registration[data.registration.length - 1].date) }}</span>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-4">等级分布</span>
        <div class="space-y-3">
          <div v-for="lv in data.levelDistribution" :key="lv.level" class="flex items-center gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400 w-16">Lv.{{ lv.level }}</span>
            <span class="text-sm text-gray-900 dark:text-white w-24">{{ lv.title }}</span>
            <div class="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :style="{ width: (lv.count / Math.max(...data.levelDistribution.map(x => x.count), 1) * 100) + '%', backgroundColor: lineColors[['registration','checkin','reading','invite'][lv.level % 4]] }" />
            </div>
            <span class="text-sm text-gray-500 w-16 text-right">{{ lv.count }}人</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
