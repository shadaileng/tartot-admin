<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'blue'
}>()

const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: 'text-green-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="text-2xl font-bold mt-1" :class="colorClasses[color || 'indigo'].text">{{ value }}</p>
      </div>
      <div v-if="icon" class="w-10 h-10 rounded-lg flex items-center justify-center" :class="colorClasses[color || 'indigo'].bg">
        <svg class="w-5 h-5" :class="colorClasses[color || 'indigo'].icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icon" />
        </svg>
      </div>
    </div>
  </div>
</template>
