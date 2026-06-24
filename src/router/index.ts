import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', layout: 'blank' },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/views/ChangePasswordView.vue'),
      meta: { title: '修改密码', layout: 'blank' },
    },
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
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { title: '用户管理' },
    },
  ],
})

router.beforeEach((to) => {
  document.title = `${(to.meta as any).title || 'Admin'} - Tarot Admin`
})

router.beforeEach((to, from, next) => {
  const { isLoggedIn, admin } = useAuth()

  // 访问登录页：已登录则跳转
  if (to.path === '/login') {
    if (!isLoggedIn.value) return next()
    if (admin.value?.mustChangePassword) return next('/change-password')
    return next('/')
  }

  // 未登录：所有页面跳转登录页
  if (!isLoggedIn.value) return next('/login')

  // 登录但未改密：除改密页外全部强制跳转改密页
  if (admin.value?.mustChangePassword && to.path !== '/change-password') {
    return next('/change-password')
  }

  // 已改密访问改密页：重定向到首页
  if (to.path === '/change-password' && !admin.value?.mustChangePassword) {
    return next('/')
  }

  next()
})

export default router
