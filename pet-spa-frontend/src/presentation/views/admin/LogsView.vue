<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useLogs } from '@/presentation/composables/useLogs'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseTable  from '@/presentation/components/ui/BaseTable.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import { formatDateTime } from '@/shared/utils/date.utils'
import { truncate } from '@/shared/utils/format.utils'
import type { AuditLogEntity } from '@/domain/entities/AuditLog.entity'

const { store, loadLogs } = useLogs()
const searchQuery = ref('')

onMounted(() => loadLogs({ limit: 100 }))

const columns = [
  { key: 'fecha',          label: 'Fecha'   },
  { key: 'accion',         label: 'Acción'  },
  { key: 'nombre_usuario', label: 'Usuario' },
  { key: 'detalle',        label: 'Detalle' },
  { key: 'ip_address',     label: 'IP'      },
]

const ACTION_COLORS: Record<string, string> = {
  USER_REGISTER:     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ACCOUNT_ACTIVATED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  EMPLOYEE_CREATE:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  EMPLOYEE_UPDATE:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  LOGIN:             'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  LOGIN_2FA:         'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ACCOUNT_LOCKED:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PASSWORD_CHANGE:   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  '2FA_ENABLED':     'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  '2FA_DISABLED':    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const filteredLogs = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return store.logs
  return store.logs.filter(l =>
    l.accion.toLowerCase().includes(q) ||
    (l.detalle ?? '').toLowerCase().includes(q) ||
    (l.ip_address ?? '').toLowerCase().includes(q) ||
    (l.nombre_usuario ?? '').toLowerCase().includes(q) ||
    (l.email_usuario ?? '').toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Logs de auditoría</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Trazabilidad completa de acciones del sistema</p>
      </div>
      <BaseButton variant="secondary" @click="loadLogs({ limit: 100 })">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Actualizar
      </BaseButton>
    </div>

    <div
      v-if="store.unavailable"
      class="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
    >
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-amber-800 dark:text-amber-300">Endpoint pendiente</p>
          <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
            <code class="bg-amber-100 dark:bg-amber-900/60 px-1 rounded">GET /api/audit-log</code> no disponible en el backend.
          </p>
        </div>
      </div>
    </div>

    <BaseCard v-if="!store.unavailable">
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por acción, usuario, detalle o IP…"
          class="w-full sm:max-w-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div v-if="store.error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
        {{ store.error }}
      </div>

      <BaseTable
        :columns="columns"
        :rows="filteredLogs as unknown as Record<string, unknown>[]"
        :loading="store.loading"
        empty-text="Sin logs registrados"
      >
        <template #fecha="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {{ formatDateTime(((row as unknown) as AuditLogEntity).fecha) }}
          </span>
        </template>
        <template #accion="{ row }">
          <BaseBadge :color="ACTION_COLORS[((row as unknown) as AuditLogEntity).accion] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'">
            {{ ((row as unknown) as AuditLogEntity).accion }}
          </BaseBadge>
        </template>
        <template #nombre_usuario="{ row }">
          <div class="text-xs">
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ ((row as unknown) as AuditLogEntity).nombre_usuario ?? '—' }}
            </p>
            <p class="text-gray-400">{{ ((row as unknown) as AuditLogEntity).email_usuario ?? '' }}</p>
          </div>
        </template>
        <template #detalle="{ row }">
          <span :title="((row as unknown) as AuditLogEntity).detalle ?? ''" class="text-xs">
            {{ truncate(((row as unknown) as AuditLogEntity).detalle ?? '—', 50) }}
          </span>
        </template>
        <template #ip_address="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {{ ((row as unknown) as AuditLogEntity).ip_address ?? '—' }}
          </code>
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>
