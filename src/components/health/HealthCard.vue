<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'blue'
}>()

const dotColor: Record<string, string> = {
  indigo: 'bg-indigo-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <div class="flex items-center gap-3">
      <span class="w-3 h-3 rounded-full" :class="dotColor[color || 'indigo']" />
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{{ value }}</p>
      </div>
    </div>
  </div>
</template>
