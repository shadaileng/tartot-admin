<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMyMenus } from '@/api'
import type { MenuTreeItem } from '@/types'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()

const menuTree = ref<MenuTreeItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const expandedGroups = ref(new Set<string>())

function toggleGroup(groupId: string) {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

function autoExpandActiveGroup() {
  for (const group of menuTree.value) {
    const hasActive = group.children.some(item => item.routeName === route.name)
    if (hasActive) {
      expandedGroups.value.add(group.id)
    }
  }
}

onMounted(async () => {
  try {
    const { menus } = await fetchMyMenus()
    menuTree.value = menus
    if (menus.length > 0) {
      expandedGroups.value.add(menus[0].id)
    }
    autoExpandActiveGroup()
  } catch (err: any) {
    console.error('加载菜单失败:', err)
    error.value = err.message || '加载菜单失败'
  } finally {
    loading.value = false
  }
})

watch(() => route.name, autoExpandActiveGroup)
</script>

<template>
  <aside class="w-56 bg-gray-900 dark:bg-gray-950 text-gray-300 flex flex-col min-h-screen shrink-0">
    <div class="px-4 py-5 border-b border-gray-700/50">
      <h1 class="text-lg font-bold text-white flex items-center gap-2">
        🔮 Tarot Admin
      </h1>
    </div>

    <nav class="flex-1 py-4 px-3 overflow-y-auto">
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-10 bg-gray-800 rounded-lg animate-pulse" />
      </div>

      <div v-else-if="error" class="px-3 py-4 text-sm text-red-400">
        {{ error }}
      </div>

      <div v-else class="space-y-1">
        <div v-for="group in menuTree" :key="group.id">
          <button
            v-if="group.children.length > 0"
            @click="toggleGroup(group.id)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="group.icon || undefined" />
            </svg>
            <span class="flex-1 text-left">{{ group.label }}</span>
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-90': expandedGroups.has(group.id) }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div v-show="expandedGroups.has(group.id)" class="ml-4 mt-1 space-y-1">
            <router-link
              v-for="item in group.children"
              :key="item.id"
              :to="item.routeName ? { name: item.routeName } : '#'"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="
                route.name === item.routeName
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              "
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon || undefined" />
              </svg>
              {{ item.label }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <div class="px-3 py-4 border-t border-gray-700/50">
      <ThemeToggle />
    </div>
  </aside>
</template>
