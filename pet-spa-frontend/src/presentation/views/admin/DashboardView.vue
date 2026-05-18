<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useEmployeesStore } from '@/presentation/stores/employees.store'
import { useAuthStore } from '@/presentation/stores/auth.store'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import { ROLE_LABELS, ROLE_COLORS } from '@/shared/constants/roles'

const employeesStore = useEmployeesStore()
const authStore      = useAuthStore()

onMounted(() => employeesStore.fetchAll())

const totalEmployees = computed(() => employeesStore.employees.length)
const activeEmployees = computed(() => employeesStore.employees.filter(e => e.estado === 'activo').length)
const inactiveEmployees = computed(() => employeesStore.employees.filter(e => e.estado !== 'activo').length)

const recentEmployees = computed(() => employeesStore.employees.slice(0, 5))

const stats = computed(() => [
  { label: 'Total empleados',   value: totalEmployees.value,   color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20'  },
  { label: 'Empleados activos', value: activeEmployees.value,  color: 'text-green-600',   bg: 'bg-green-50 dark:bg-green-900/20'       },
  { label: 'Inactivos',         value: inactiveEmployees.value, color: 'text-gray-600',   bg: 'bg-gray-50 dark:bg-gray-800'            },
])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Bienvenido, {{ authStore.user?.nombre }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        :class="['rounded-2xl border border-gray-200 dark:border-gray-700 p-5', stat.bg]"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
        <p :class="['text-3xl font-bold mt-1', stat.color]">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Recent employees -->
    <BaseCard title="Empleados recientes" subtitle="Últimos registros del sistema">
      <div v-if="employeesStore.loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>

      <div v-else-if="recentEmployees.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
        No hay empleados registrados
      </div>

      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800 -mx-6 px-6">
        <li
          v-for="emp in recentEmployees"
          :key="emp.id_usuario"
          class="py-3 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
              {{ emp.nombre.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ emp.nombre }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ emp.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <BaseBadge :color="ROLE_COLORS[emp.rol]">{{ ROLE_LABELS[emp.rol] ?? emp.rol }}</BaseBadge>
          </div>
        </li>
      </ul>
    </BaseCard>

    <!-- System info -->
    <BaseCard title="Información del sistema">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-gray-500 dark:text-gray-400">Tu rol</p>
          <BaseBadge :color="ROLE_COLORS[authStore.userRole ?? '']" class="mt-1">
            {{ ROLE_LABELS[authStore.userRole ?? ''] ?? authStore.userRole }}
          </BaseBadge>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Email</p>
          <p class="text-gray-900 dark:text-white font-medium mt-1">{{ authStore.user?.email }}</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
