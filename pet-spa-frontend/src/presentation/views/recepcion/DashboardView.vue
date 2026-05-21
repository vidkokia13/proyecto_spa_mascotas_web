<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCitas } from '@/presentation/composables/useCitas'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const router = useRouter()
const { store, loadRango } = useCitas()

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

onMounted(() => loadRango({ fechaInicio: today, fechaFin: tomorrow }))
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel de recepción</h1>
      <div class="flex gap-2">
        <BaseButton variant="secondary" size="sm" @click="router.push({ name: ROUTE_NAMES.AGENDA_BLOQUEOS })">
          Bloqueos
        </BaseButton>
        <BaseButton size="sm" @click="router.push({ name: ROUTE_NAMES.AGENDA_CITAS })">
          Ver agenda completa
        </BaseButton>
      </div>
    </div>

    <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Citas de hoy</h2>

    <div v-if="store.loading" class="text-center py-12 text-gray-400">Cargando…</div>

    <div v-else-if="store.citas.length === 0" class="text-center py-10">
      <p class="text-gray-500">No hay citas programadas para hoy.</p>
    </div>

    <div v-else class="space-y-3">
      <BaseCard v-for="c in store.citas" :key="c.id_cita">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="w-16 text-center">
            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatHora(c.fecha_hora_inicio) }}</p>
            <p class="text-xs text-gray-400">{{ c.duracion_ajustada }} min</p>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="font-medium text-gray-900 dark:text-white">{{ c.nombre_cliente }}</span>
              <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
            </div>
            <p class="text-sm text-gray-500">
              {{ c.nombre_mascota }} · {{ c.nombre_servicio }}
              <span v-if="c.nombre_trabajador"> · {{ c.nombre_trabajador }}</span>
            </p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
