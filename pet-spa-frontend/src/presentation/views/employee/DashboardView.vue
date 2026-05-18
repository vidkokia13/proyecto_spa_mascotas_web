<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import { ROLE_LABELS, ROLE_COLORS } from '@/shared/constants/roles'

const authStore = useAuthStore()
const router    = useRouter()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ greeting }}, {{ authStore.user?.nombre?.split(' ')[0] }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Panel de empleado</p>
    </div>

    <!-- Profile card -->
    <BaseCard>
      <div class="flex items-center gap-5">
        <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl flex-shrink-0">
          {{ authStore.user?.nombre?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ authStore.user?.nombre }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
          <div class="flex items-center gap-2 mt-2">
            <BaseBadge :color="ROLE_COLORS[authStore.userRole ?? '']">
              {{ ROLE_LABELS[authStore.userRole ?? ''] ?? authStore.userRole }}
            </BaseBadge>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Quick links -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BaseCard>
        <div class="flex flex-col gap-3">
          <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-700 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white text-sm">Seguridad</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Administrá tu contraseña</p>
          </div>
          <BaseButton size="sm" variant="secondary" @click="router.push({ name: ROUTE_NAMES.CHANGE_PASSWORD })">
            Ir a seguridad
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="flex flex-col gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-700 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white text-sm">Agenda</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Módulo próximamente</p>
          </div>
          <BaseButton size="sm" variant="secondary" disabled>
            Próximamente
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
