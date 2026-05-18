<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/presentation/stores/auth.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import { ROLE_COLORS, ROLE_LABELS } from '@/shared/constants/roles'
import { formatDateTime } from '@/shared/utils/date.utils'

const authStore = useAuthStore()

onMounted(() => authStore.fetchProfile())
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Información de tu cuenta</p>
    </div>

    <BaseCard>
      <div class="flex items-center gap-5 mb-6">
        <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl">
          {{ authStore.user?.nombre?.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ authStore.user?.nombre }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
          <BaseBadge :color="ROLE_COLORS[authStore.userRole ?? '']" class="mt-2">
            {{ ROLE_LABELS[authStore.userRole ?? ''] ?? authStore.userRole }}
          </BaseBadge>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</p>
          <BaseBadge
            :color="authStore.profile?.estado === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600'"
            class="mt-1"
          >
            {{ authStore.profile?.estado ?? '—' }}
          </BaseBadge>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Último acceso</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">
            {{ formatDateTime(authStore.profile?.ultimo_acceso) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID de cliente</p>
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block break-all">
            {{ authStore.user?.id_cliente ?? '—' }}
          </code>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">2FA</p>
          <BaseBadge
            :color="authStore.profile?.two_factor_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
            class="mt-1"
          >
            {{ authStore.profile?.two_factor_enabled ? 'Activado' : 'No activado' }}
          </BaseBadge>
        </div>
      </div>
    </BaseCard>

    <BaseCard title="Acceso limitado">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Como cliente, tu acceso está limitado a esta pantalla. Para más información o modificaciones en tu cuenta, contactá al personal de Pet Spa.
      </p>
    </BaseCard>
  </div>
</template>
