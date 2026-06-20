<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { fetchMetricsRaw, parsePrometheusMetrics } from '@/api'
import type { MetricsSnapshot } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const metrics = ref<Partial<MetricsSnapshot>>({})
const loading = ref(true)

onMounted(async () => {
  try {
    const raw = await fetchMetricsRaw()
    metrics.value = parsePrometheusMetrics(raw)
  } finally {
    loading.value = false
  }
})

const chartData = ref({
  labels: ['请求数', '缓存命中', '缓存未命中', '错误数'],
  datasets: [
    {
      label: '指标',
      data: [0, 0, 0, 0],
      backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'],
      borderRadius: 6,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

function updateChart() {
  chartData.value.datasets[0].data = [
    metrics.value.totalRequests ?? 0,
    metrics.value.cacheHits ?? 0,
    metrics.value.cacheMisses ?? 0,
    metrics.value.errorCount ?? 0,
  ]
}

onMounted(() => {
  const unwatch = setInterval(updateChart, 1000)
  updateChart()
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">缓存命中率</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {{ ((metrics.cacheHitRate ?? 0) * 100).toFixed(1) }}%
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">总请求</p>
          <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {{ metrics.totalRequests ?? 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">错误数</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
            {{ metrics.errorCount ?? 0 }}
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">请求分布</h3>
        <div class="h-64">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </template>
  </div>
</template>
