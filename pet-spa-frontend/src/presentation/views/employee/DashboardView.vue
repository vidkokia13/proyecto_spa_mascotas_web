<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { useRouter } from 'vue-router'
import { useCitas } from '@/presentation/composables/useCitas'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import { ROLE_LABELS, ROLE_COLORS } from '@/shared/constants/roles'

const authStore = useAuthStore()
const router    = useRouter()
const { store, loadRango, cambiarEstado } = useCitas()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const today    = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', en_proceso: 'En proceso',
  completada: 'Completada', cancelada: 'Cancelada',
}
const ESTADO_COLOR: Record<string, string> = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completada: 'bg-gray-100 text-gray-700',
  cancelada:  'bg-red-100 text-red-800',
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

type EstadoNext = 'confirmada' | 'en_proceso' | 'completada' | 'cancelada'
const WORKER_TRANSITIONS: Record<string, EstadoNext[]> = {
  pendiente:  ['confirmada', 'en_proceso', 'cancelada'],
  confirmada: ['en_proceso', 'cancelada'],
  en_proceso: ['completada'],
}

onMounted(() => {
  const idTrabajador = authStore.user?.id_trabajador
  loadRango({ fechaInicio: today, fechaFin: tomorrow, idTrabajador: idTrabajador ?? undefined })
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ greeting }}, {{ authStore.user?.nombre?.split(' ')[0] }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Panel de groomer</p>
    </div>

    <!-- Profile card -->
    <BaseCard>
      <div class="flex items-center gap-5">
        <div class="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl flex-shrink-0">
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
        <div class="flex gap-2">
          <BaseButton size="sm" @click="router.push({ name: ROUTE_NAMES.AGENDA_CITAS })">Ver agenda</BaseButton>
          <BaseButton size="sm" variant="secondary" @click="router.push({ name: ROUTE_NAMES.CHANGE_PASSWORD })">Seguridad</BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Today's appointments -->
    <div>
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Mis citas de hoy</h2>

      <div v-if="store.loading" class="text-center py-8 text-gray-400">Cargando…</div>
      <div v-else-if="store.citas.length === 0" class="text-center py-10">
        <p class="text-gray-500">No tienes citas programadas para hoy.</p>
      </div>
      <div v-else class="space-y-3">
        <BaseCard v-for="c in store.citas" :key="c.id_cita">
          <div class="flex items-start gap-4 flex-wrap">
            <div class="w-14 text-center flex-shrink-0">
              <p class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatHora(c.fecha_hora_inicio) }}</p>
              <p class="text-xs text-gray-400">{{ c.duracion_ajustada }} min</p>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                <span class="font-medium text-gray-900 dark:text-white">{{ c.nombre_mascota }}</span>
                <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
              </div>
              <p class="text-sm text-gray-500">{{ c.nombre_cliente }} · {{ c.nombre_servicio }}</p>
              <p v-if="c.notas" class="text-xs text-gray-400 italic mt-1">{{ c.notas }}</p>
            </div>
            <div class="flex gap-2 flex-wrap">
              <BaseButton
                v-for="next in WORKER_TRANSITIONS[c.estado] ?? []"
                :key="next"
                size="sm"
                :variant="next === 'cancelada' ? 'danger' : 'primary'"
                :disabled="store.loading"
                @click="cambiarEstado(c.id_cita, next)"
              >
                {{ ESTADO_LABEL[next] }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
