<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { changePassword, isLoggedIn, admin } = useAuth()

// 未登录直接跳转
if (!isLoggedIn.value) {
  router.replace('/login')
}

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleChange() {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    errorMsg.value = '请填写所有字段'
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }

  if (form.newPassword.length < 8) {
    errorMsg.value = '新密码长度不能少于 8 位'
    return
  }

  if (!/[a-zA-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
    errorMsg.value = '新密码必须包含字母和数字'
    return
  }

  if (loading.value) return

  loading.value = true
  errorMsg.value = ''

  try {
    await changePassword(form.oldPassword, form.newPassword)
    successMsg.value = '密码修改成功，请使用新密码重新登录'
    // 2 秒后跳转登录页
    setTimeout(() => {
      router.replace('/login')
    }, 2000)
  } catch (err: any) {
    errorMsg.value = err.message || '修改密码失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-md">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">🔐 修改密码</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          首次登录必须修改默认密码以确保账号安全
        </p>
      </div>

      <!-- 改密卡片 -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <!-- 成功提示 -->
        <div
          v-if="successMsg"
          class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400 mb-5"
        >
          {{ successMsg }}
        </div>

        <form v-else @submit.prevent="handleChange" class="space-y-5">
          <!-- 旧密码 -->
          <div>
            <label for="oldPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              旧密码
            </label>
            <input
              id="oldPassword"
              v-model="form.oldPassword"
              type="password"
              autocomplete="current-password"
              placeholder="请输入当前密码"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>

          <!-- 新密码 -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              新密码
            </label>
            <input
              id="newPassword"
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="至少 8 位，包含字母和数字"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>

          <!-- 确认新密码 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              确认新密码
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="再次输入新密码"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>

          <!-- 错误提示 -->
          <div
            v-if="errorMsg"
            class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
          >
            {{ errorMsg }}
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '修改中...' : '确认修改' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
