import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@/core/guards/auth.guard'
import { roleGuard } from '@/core/guards/role.guard'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/roles'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ─── Auth / Public ────────────────────────────────────────────────────────
    {
      path: '/login',
      name: ROUTE_NAMES.LOGIN,
      component: () => import('@/presentation/views/auth/LoginView.vue'),
      meta: { guestOnly: true, layout: 'auth' },
    },
    {
      path: '/register',
      name: ROUTE_NAMES.REGISTER,
      component: () => import('@/presentation/views/auth/RegisterView.vue'),
      meta: { guestOnly: true, layout: 'auth' },
    },
    {
      path: '/activate',
      name: ROUTE_NAMES.ACTIVATE,
      component: () => import('@/presentation/views/auth/ActivateAccountView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/2fa',
      name: ROUTE_NAMES.TWO_FACTOR,
      component: () => import('@/presentation/views/auth/TwoFactorView.vue'),
      meta: { layout: 'auth' },
    },

    // ─── Change password (all authenticated) ─────────────────────────────────
    {
      path: '/change-password',
      name: ROUTE_NAMES.CHANGE_PASSWORD,
      component: () => import('@/presentation/views/auth/ChangePasswordView.vue'),
      meta: { requiresAuth: true, layout: 'dashboard' },
    },

    // ─── Admin / Jefe ─────────────────────────────────────────────────────────
    {
      path: '/admin',
      redirect: { name: ROUTE_NAMES.ADMIN_DASHBOARD },
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: ROUTE_NAMES.ADMIN_DASHBOARD,
          component: () => import('@/presentation/views/admin/DashboardView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'users',
          name: ROUTE_NAMES.ADMIN_USERS,
          component: () => import('@/presentation/views/admin/UsersView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'logs',
          name: ROUTE_NAMES.ADMIN_LOGS,
          component: () => import('@/presentation/views/admin/LogsView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: '2fa-setup',
          name: ROUTE_NAMES.ADMIN_2FA_SETUP,
          component: () => import('@/presentation/views/admin/TwoFactorSetupView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
      ],
    },

    // ─── Employee ─────────────────────────────────────────────────────────────
    {
      path: '/employee',
      redirect: { name: ROUTE_NAMES.EMPLOYEE_DASHBOARD },
      children: [
        {
          path: 'dashboard',
          name: ROUTE_NAMES.EMPLOYEE_DASHBOARD,
          component: () => import('@/presentation/views/employee/DashboardView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.TRABAJADOR]),
        },
      ],
    },

    // ─── Client ───────────────────────────────────────────────────────────────
    {
      path: '/profile',
      name: ROUTE_NAMES.CLIENT_PROFILE,
      component: () => import('@/presentation/views/client/ProfileView.vue'),
      meta: { requiresAuth: true, layout: 'dashboard' },
      beforeEnter: roleGuard([ROLES.CLIENTE]),
    },

    // ─── Error pages ──────────────────────────────────────────────────────────
    {
      path: '/403',
      name: ROUTE_NAMES.FORBIDDEN,
      component: () => import('@/presentation/views/ForbiddenView.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: ROUTE_NAMES.NOT_FOUND,
      component: () => import('@/presentation/views/NotFoundView.vue'),
      meta: { layout: 'auth' },
    },
    { path: '/', redirect: '/login' },
  ],
})

router.beforeEach(authGuard)

export default router
