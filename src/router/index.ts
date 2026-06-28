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
    {
      path: '/admins',
      name: 'admins',
      component: () => import('@/views/AdminsView.vue'),
      meta: { title: '管理员管理', requireRole: 'admin' },
    },
    {
      path: '/levels',
      name: 'levels',
      component: () => import('@/views/LevelsView.vue'),
      meta: { title: '等级管理' },
    },
    {
      path: '/task-definitions',
      name: 'task-definitions',
      component: () => import('@/views/TaskDefinitionsView.vue'),
      meta: { title: '任务管理' },
    },
    {
      path: '/user-stats',
      name: 'user-stats',
      component: () => import('@/views/UserStatsView.vue'),
      meta: { title: '用户统计' },
    },
    {
      path: '/stats-trends',
      name: 'stats-trends',
      component: () => import('@/views/StatsTrendView.vue'),
      meta: { title: '趋势统计' },
    },
    {
      path: '/invite-records',
      name: 'invite-records',
      component: () => import('@/views/InviteRecordsView.vue'),
      meta: { title: '邀请记录' },
    },
    {
      path: '/checkin-stats',
      name: 'checkin-stats',
      component: () => import('@/views/CheckinStatsView.vue'),
      meta: { title: '签到统计' },
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

  // role 权限校验：只有 role=admin 可访问管理员管理
  if ((to.meta as any).requireRole === 'admin' && admin.value?.role !== 'admin') {
    return next('/')
  }

  next()
})

export default router
