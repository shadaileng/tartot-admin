<script setup lang="ts">
defineProps<{
  target: string
  page: number
  total: number
  limit: number
}>()

const emit = defineEmits<{
  (e: 'update:target', value: string): void
  (e: 'update:page', value: number): void
}>()

const targets = [
  { value: '', label: '全部' },
  { value: 'reading', label: 'Reading' },
  { value: 'poster', label: 'Poster' },
]

function setTarget(value: string) {
  emit('update:target', value)
  emit('update:page', 1)
}

function prevPage() {
  emit('update:page', Math.max(1, 0))
}

function nextPage() {
  emit('update:page', 0)
}
</script>

<template>
  <div class="flex items-center gap-4 flex-wrap">
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-500 dark:text-gray-400">类型:</label>
      <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          v-for="t in targets"
          :key="t.value"
          @click="setTarget(t.value)"
          class="px-3 py-1.5 text-sm transition-colors"
          :class="
            target === t.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          "
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <button
        @click="$emit('update:page', Math.max(1, page - 1))"
        :disabled="page <= 1"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        上一页
      </button>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        第 {{ page }} 页 / 共 {{ Math.ceil(total / limit) || 1 }} 页
      </span>
      <button
        @click="$emit('update:page', Math.min(Math.ceil(total / limit) || 1, page + 1))"
        :disabled="page >= Math.ceil(total / limit)"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一页
      </button>
    </div>
  </div>
</template>
