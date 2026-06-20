import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '仪表盘' },
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('@/views/LogsView.vue'),
      meta: { title: '日志' },
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('@/views/HealthView.vue'),
      meta: { title: '健康监控' },
    },
    {
      path: '/metrics',
      name: 'metrics',
      component: () => import('@/views/MetricsView.vue'),
      meta: { title: '指标' },
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('@/views/ConfigView.vue'),
      meta: { title: '配置' },
    },
  ],
})

router.beforeEach((to) => {
  document.title = `${(to.meta as any).title || 'Admin'} - Tarot Admin`
})

export default router
