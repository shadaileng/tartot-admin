<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header class="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-6 shrink-0">
    <h2 class="text-base font-semibold text-gray-800 dark:text-gray-200">
      {{ (route.meta as any).title }}
    </h2>
  </header>
</template>
