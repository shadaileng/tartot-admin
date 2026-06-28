<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { UserStatsEntry } from '@/types'
import { fetchUserStatsList, updateUserPoints, resetUserQuota, clearUserInvite } from '@/api'

const { admin } = useAuth()
const data = ref<UserStatsEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const keyword = ref('')
const loading = ref(true)
const errorMsg = ref('')

const showAdjust = ref(false)
const adjustTarget = ref<UserStatsEntry | null>(null)
const adjustDelta = ref(0)
const adjusting = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function doLoad() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchUserStatsList({
      page: page.value,
      limit: limit.value,
      keyword: keyword.value || undefined,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    errorMsg.value = err.message || '加载用户统计失败'
  } finally {
    loading.value = false
  }
}

function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    doLoad()
  }, 300)
}

watch(keyword, triggerSearch)
watch(page, doLoad, { immediate: true })

const totalPages = computed(() => Math.ceil(total.value / limit.value))

function openAdjust(user: UserStatsEntry) {
  adjustTarget.value = user
  adjustDelta.value = 0
  showAdjust.value = true
}

async function doAdjust() {
  if (!adjustTarget.value || adjustDelta.value === 0) return
  adjusting.value = true
  try {
    await updateUserPoints(adjustTarget.value.user_id, adjustDelta.value)
    showAdjust.value = false
    await doLoad()
  } catch (err: any) {
    errorMsg.value = err.message || '调整积分失败'
  } finally {
    adjusting.value = false
  }
}

async function doResetQuota(userId: string) {
  try {
    await resetUserQuota(userId)
    await doLoad()
  } catch (err: any) {
    errorMsg.value = err.message || '重置额度失败'
  }
}

async function doClearInvite(userId: string) {
  try {
    await clearUserInvite(userId)
    await doLoad()
  } catch (err: any) {
    errorMsg.value = err.message || '清除邀请绑定失败'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">用户积分统计</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 人</span>
        <input v-model="keyword" placeholder="搜索昵称/邮箱/ID"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-48" />
      </div>
    </div>

    <div v-if="errorMsg" class="px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">用户</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">积分</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">等级</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">额外额度</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">占卜次数</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">已用额度</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">签到连续</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">邀请码</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">注册时间</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.user_id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">{{ row.nickname || '匿名' }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.email || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">{{ row.points }}</td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  Lv.{{ row.level }} {{ row.level_title }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ row.extra_quota }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ row.total_readings }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ row.daily_quota_used }}</td>
              <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{{ row.consecutive_checkins }} 天</td>
              <td class="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{{ row.referral_code }}</td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.created_at) }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button v-if="admin?.role === 'admin'" @click="openAdjust(row)"
                    class="px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors">
                    积分
                  </button>
                  <button v-if="admin?.role === 'admin'" @click="doResetQuota(row.user_id)"
                    class="px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors">
                    重置额度
                  </button>
                  <button v-if="admin?.role === 'admin'" @click="doClearInvite(row.user_id)"
                    class="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                    清除邀请
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <span class="text-sm text-gray-500 dark:text-gray-400">第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            上一页
          </button>
          <button :disabled="page >= totalPages" @click="page++"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            下一页
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAdjust" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showAdjust = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">调整积分</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            用户：{{ adjustTarget?.nickname || '匿名' }}（当前 {{ adjustTarget?.points }} 分）
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              变动值（正数增加，负数减少）
            </label>
            <input v-model.number="adjustDelta" type="number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showAdjust = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">取消</button>
            <button @click="doAdjust" :disabled="adjusting || adjustDelta === 0"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {{ adjusting ? '调整中...' : '确认调整' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
