<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <TopBar />
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
