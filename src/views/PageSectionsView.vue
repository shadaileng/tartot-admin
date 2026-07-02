<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { PageSectionEntry } from '@/types'
import { fetchPageSections, updatePageSection } from '@/api'

const { admin } = useAuth()
const sections = ref<PageSectionEntry[]>([])
const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')

const isReadonly = computed(() => admin.value?.role === 'readonly')

const indexSections = computed(() => sections.value.filter(s => s.pageKey === 'index'))
const drawSections = computed(() => sections.value.filter(s => s.pageKey === 'draw'))

async function loadSections() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchPageSections()
    sections.value = res.sections
  } catch (err: any) {
    errorMsg.value = err.message || '加载页面配置失败'
  } finally {
    loading.value = false
  }
}

async function toggleSection(section: PageSectionEntry) {
  if (isReadonly.value) return
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await updatePageSection(section.id, !section.visible)
    section.visible = !section.visible
    successMsg.value = '已更新'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (err: any) {
    errorMsg.value = err.message || '更新失败'
  }
}

onMounted(loadSections)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">页面管理</h2>
    </div>

    <div v-if="errorMsg" class="px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
      {{ errorMsg }}
    </div>

    <div v-if="successMsg" class="px-4 py-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
      {{ successMsg }}
    </div>

    <div v-if="isReadonly" class="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
      当前为只读模式，无法修改配置
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <template v-else>
      <!-- 首页 -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-medium text-gray-900 dark:text-white">首页</h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="section in indexSections" :key="section.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ section.label }}</span>
              <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">{{ section.sectionKey }}</span>
            </div>
            <button
              @click="toggleSection(section)"
              :disabled="isReadonly"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="section.visible ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="section.visible ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- 抽牌页 -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-medium text-gray-900 dark:text-white">抽牌页</h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="section in drawSections" :key="section.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ section.label }}</span>
              <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">{{ section.sectionKey }}</span>
            </div>
            <button
              @click="toggleSection(section)"
              :disabled="isReadonly"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="section.visible ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="section.visible ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
