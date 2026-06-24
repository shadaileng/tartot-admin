<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { admin, logout } = useAuth()

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleChangePassword() {
  closeMenu()
  router.push('/change-password')
}

function handleLogout() {
  closeMenu()
  logout()
  router.replace('/login')
}
</script>

<template>
  <header class="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
    <h2 class="text-base font-semibold text-gray-800 dark:text-gray-200">
      {{ (route.meta as any).title }}
    </h2>

    <!-- 用户菜单 -->
    <div class="relative">
      <button
        @click="toggleMenu"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {{ admin?.displayName?.charAt(0)?.toUpperCase() || 'A' }}
        </div>
        <span class="max-w-[120px] truncate">{{ admin?.displayName || '管理员' }}</span>
        <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- 下拉菜单 -->
      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
        @click.stop
      >
        <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ admin?.displayName || '管理员' }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ admin?.role === 'admin' ? '管理员' : '只读' }}</p>
        </div>
        <button
          @click="handleChangePassword"
          class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          修改密码
        </button>
        <button
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出登录
        </button>
      </div>

      <!-- 遮罩层（点击关闭菜单） -->
      <div
        v-if="menuOpen"
        class="fixed inset-0 z-40"
        @click="closeMenu"
      />
    </div>
  </header>
</template>
