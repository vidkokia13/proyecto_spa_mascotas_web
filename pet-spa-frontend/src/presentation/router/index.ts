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
        {
          path: 'servicios',
          name: ROUTE_NAMES.ADMIN_SERVICIOS,
          component: () => import('@/presentation/views/admin/ServiciosView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'insumos',
          name: ROUTE_NAMES.ADMIN_INSUMOS,
          component: () => import('@/presentation/views/admin/InsumosView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'promociones',
          name: ROUTE_NAMES.ADMIN_PROMOCIONES,
          component: () => import('@/presentation/views/admin/PromocionesView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'caja',
          name: ROUTE_NAMES.ADMIN_CAJA,
          component: () => import('@/presentation/views/admin/CajaView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE, ROLES.RECEPCION]),
        },
      ],
    },

    // ─── Cita detalle (all internal roles) ───────────────────────────────────
    {
      path: '/citas/:id',
      name: ROUTE_NAMES.CITA_DETALLE,
      component: () => import('@/presentation/views/cita/CitaDetalleView.vue'),
      meta: { requiresAuth: true, layout: 'dashboard' },
      beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE, ROLES.TRABAJADOR, ROLES.RECEPCION]),
    },

    // ─── Agenda (admin / jefe / trabajador / recepcion) ───────────────────────
    {
      path: '/agenda',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'citas',
          name: ROUTE_NAMES.AGENDA_CITAS,
          component: () => import('@/presentation/views/agenda/CitasView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE, ROLES.TRABAJADOR, ROLES.RECEPCION]),
        },
        {
          path: 'horarios',
          name: ROUTE_NAMES.AGENDA_HORARIOS,
          component: () => import('@/presentation/views/agenda/HorariosView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
        {
          path: 'bloqueos',
          name: ROUTE_NAMES.AGENDA_BLOQUEOS,
          component: () => import('@/presentation/views/agenda/BloqueosView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE, ROLES.RECEPCION]),
        },
        {
          path: 'calendario',
          name: ROUTE_NAMES.AGENDA_CALENDARIO,
          component: () => import('@/presentation/views/agenda/CalendarioView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE, ROLES.RECEPCION, ROLES.TRABAJADOR]),
        },
        {
          path: 'groomers',
          name: ROUTE_NAMES.AGENDA_GROOMERS,
          component: () => import('@/presentation/views/agenda/GroomersView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.ADMIN, ROLES.JEFE]),
        },
      ],
    },

    // ─── Recepcion ────────────────────────────────────────────────────────────
    {
      path: '/recepcion',
      redirect: { name: ROUTE_NAMES.RECEPCION_DASHBOARD },
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: ROUTE_NAMES.RECEPCION_DASHBOARD,
          component: () => import('@/presentation/views/recepcion/DashboardView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.RECEPCION]),
        },
      ],
    },

    // ─── Caja (admin redirect from /admin/caja to /admin section) ────────────
    // Note: /admin/caja is already registered under admin children above.

    // ─── Employee (groomer) ───────────────────────────────────────────────────
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
      path: '/client',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'profile',
          name: ROUTE_NAMES.CLIENT_PROFILE,
          component: () => import('@/presentation/views/client/ProfileView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.CLIENTE]),
        },
        {
          path: 'mascotas',
          name: ROUTE_NAMES.CLIENT_MASCOTAS,
          component: () => import('@/presentation/views/client/MascotasView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.CLIENTE]),
        },
        {
          path: 'citas',
          name: ROUTE_NAMES.CLIENT_CITAS,
          component: () => import('@/presentation/views/client/CitasView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.CLIENTE]),
        },
        {
          path: 'nueva-cita',
          name: ROUTE_NAMES.CLIENT_NUEVA_CITA,
          component: () => import('@/presentation/views/client/NuevaCitaView.vue'),
          meta: { requiresAuth: true, layout: 'dashboard' },
          beforeEnter: roleGuard([ROLES.CLIENTE]),
        },
      ],
    },

    // Keep old /profile redirect for backward compat
    {
      path: '/profile',
      redirect: { name: ROUTE_NAMES.CLIENT_PROFILE },
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
