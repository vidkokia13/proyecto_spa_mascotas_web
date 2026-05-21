<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import { ROLE_LABELS } from '@/shared/constants/roles'
import { useAuth } from '@/presentation/composables/useAuth'

const authStore = useAuthStore()
const uiStore   = useUiStore()
const route     = useRoute()
const { logout } = useAuth()

interface NavItem {
  name: string
  route: string
  icon: string
  label: string
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const navGroups = computed<NavGroup[]>(() => {
  const role = authStore.userRole

  if (role === 'admin' || role === 'jefe') {
    return [
      {
        label: 'Administración',
        items: [
          { name: ROUTE_NAMES.ADMIN_DASHBOARD, route: '/admin/dashboard', icon: 'chart',    label: 'Dashboard'  },
          { name: ROUTE_NAMES.ADMIN_USERS,     route: '/admin/users',     icon: 'users',    label: 'Usuarios'   },
          { name: ROUTE_NAMES.ADMIN_LOGS,      route: '/admin/logs',      icon: 'shield',   label: 'Logs'       },
          { name: ROUTE_NAMES.ADMIN_2FA_SETUP, route: '/admin/2fa-setup', icon: 'lock-2fa', label: 'Seguridad'  },
        ],
      },
      {
        label: 'Agenda',
        items: [
          { name: ROUTE_NAMES.AGENDA_CITAS,    route: '/agenda/citas',    icon: 'calendar', label: 'Citas'      },
          { name: ROUTE_NAMES.AGENDA_HORARIOS, route: '/agenda/horarios', icon: 'clock',    label: 'Horarios'   },
          { name: ROUTE_NAMES.AGENDA_BLOQUEOS, route: '/agenda/bloqueos', icon: 'block',    label: 'Bloqueos'   },
        ],
      },
    ]
  }

  if (role === 'recepcion') {
    return [
      {
        items: [
          { name: ROUTE_NAMES.RECEPCION_DASHBOARD, route: '/recepcion/dashboard', icon: 'home',     label: 'Panel'        },
          { name: ROUTE_NAMES.AGENDA_CITAS,        route: '/agenda/citas',        icon: 'calendar', label: 'Agenda'       },
          { name: ROUTE_NAMES.AGENDA_BLOQUEOS,     route: '/agenda/bloqueos',     icon: 'block',    label: 'Bloqueos'     },
          { name: ROUTE_NAMES.CHANGE_PASSWORD,     route: '/change-password',     icon: 'lock',     label: 'Seguridad'    },
        ],
      },
    ]
  }

  if (role === 'trabajador') {
    return [
      {
        items: [
          { name: ROUTE_NAMES.EMPLOYEE_DASHBOARD, route: '/employee/dashboard', icon: 'home',     label: 'Panel'            },
          { name: ROUTE_NAMES.AGENDA_CITAS,       route: '/agenda/citas',       icon: 'calendar', label: 'Agenda'           },
          { name: ROUTE_NAMES.CHANGE_PASSWORD,    route: '/change-password',    icon: 'lock',     label: 'Cambiar contraseña'},
        ],
      },
    ]
  }

  // cliente
  return [
    {
      items: [
        { name: ROUTE_NAMES.CLIENT_MASCOTAS,   route: '/client/mascotas',   icon: 'pet',      label: 'Mis mascotas' },
        { name: ROUTE_NAMES.CLIENT_CITAS,      route: '/client/citas',      icon: 'calendar', label: 'Mis citas'    },
        { name: ROUTE_NAMES.CLIENT_NUEVA_CITA, route: '/client/nueva-cita', icon: 'plus',     label: 'Nueva cita'   },
        { name: ROUTE_NAMES.CLIENT_PROFILE,    route: '/client/profile',    icon: 'user',     label: 'Mi perfil'    },
      ],
    },
  ]
})
</script>

<template>
  <aside
    :class="[
      'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 transition-all duration-300 z-30',
      uiStore.sidebarOpen ? 'w-64' : 'w-16',
    ]"
  >
    <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
      <div class="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <span v-if="uiStore.sidebarOpen" class="font-bold text-gray-900 dark:text-white text-sm">Pet Spa</span>
    </div>

    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <div v-for="(group, gi) in navGroups" :key="gi" :class="gi > 0 ? 'mt-4' : ''">
        <p v-if="group.label && uiStore.sidebarOpen"
          class="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
          {{ group.label }}
        </p>
        <div class="space-y-1">
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :to="item.route"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              route.name === item.name
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            ]"
          >
            <!-- chart -->
            <svg v-if="item.icon === 'chart'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <!-- users -->
            <svg v-else-if="item.icon === 'users'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- shield -->
            <svg v-else-if="item.icon === 'shield'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <!-- home -->
            <svg v-else-if="item.icon === 'home'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <!-- lock -->
            <svg v-else-if="item.icon === 'lock'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <!-- lock-2fa -->
            <svg v-else-if="item.icon === 'lock-2fa'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <!-- calendar -->
            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <!-- clock -->
            <svg v-else-if="item.icon === 'clock'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <!-- block / no-entry -->
            <svg v-else-if="item.icon === 'block'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <!-- pet (heart) -->
            <svg v-else-if="item.icon === 'pet'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <!-- plus -->
            <svg v-else-if="item.icon === 'plus'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <!-- user (fallback) -->
            <svg v-else class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>

            <span v-if="uiStore.sidebarOpen" class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="border-t border-gray-100 dark:border-gray-800 p-3">
      <div v-if="uiStore.sidebarOpen" class="flex items-center gap-3 px-3 py-2 mb-1">
        <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm flex-shrink-0">
          {{ authStore.user?.nombre?.charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ authStore.user?.nombre }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.rol ? ROLE_LABELS[authStore.user.rol] : '' }}</p>
        </div>
      </div>
      <button
        class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        @click="logout"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="uiStore.sidebarOpen">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
