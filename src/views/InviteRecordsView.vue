<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { AdminInviteRecord } from '@/types'
import { fetchAdminInviteRecords, completeInviteRecord, deleteInviteRecord } from '@/api'

const { admin } = useAuth()
const data = ref<AdminInviteRecord[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('')
const keyword = ref('')
const loading = ref(true)
const errorMsg = ref('')
const showDeleteConfirm = ref(false)
const deleteTarget = ref<AdminInviteRecord | null>(null)

async function doLoad() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchAdminInviteRecords({
      page: page.value,
      limit: limit.value,
      status: status.value || undefined,
      keyword: keyword.value || undefined,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    errorMsg.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.ceil(total.value / limit.value))

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; doLoad() }, 300)
}

watch(keyword, triggerSearch)
watch([page, status], doLoad, { immediate: true })

async function doComplete(id: string) {
  try {
    await completeInviteRecord(id)
    await doLoad()
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败'
  }
}

function confirmDelete(record: AdminInviteRecord) {
  deleteTarget.value = record
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteInviteRecord(deleteTarget.value.id)
    showDeleteConfirm.value = false
    deleteTarget.value = null
    await doLoad()
  } catch (err: any) {
    errorMsg.value = err.message || '删除失败'
  }
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">邀请记录</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 条</span>
        <div class="relative">
          <select v-model="status" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
            <option value="">全部状态</option>
            <option value="pending">待完成</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <input v-model="keyword" placeholder="搜索邀请人/被邀请人"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-48" />
      </div>
    </div>

    <div v-if="errorMsg" class="px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">{{ errorMsg }}</div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">邀请人</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">被邀请人</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">邀请时间</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">完成时间</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ row.inviter_name || '已注销' }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ row.invitee_name || '已注销' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="row.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'">
                  {{ row.status === 'completed' ? '已完成' : '待完成' }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.created_at) }}</td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.completed_at) }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button v-if="row.status === 'pending' && admin?.role === 'admin'" @click="doComplete(row.id)"
                    class="px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors">
                    完成
                  </button>
                  <button v-if="admin?.role === 'admin'" @click="confirmDelete(row)"
                    class="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <span class="text-sm text-gray-500">第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">上一页</button>
          <button :disabled="page >= totalPages" @click="page++"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">下一页</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showDeleteConfirm = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">确认删除</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">确定要删除此邀请记录吗？此操作不可撤销。</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteConfirm = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">取消</button>
            <button @click="doDelete"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
