<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCitas } from '@/presentation/composables/useCitas'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { EstadoCita } from '@/shared/types/agenda.types'

const router = useRouter()
const { store, loadMisCitas, cambiarEstado } = useCitas()

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada:  'Cancelada',
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completada: 'bg-gray-100 text-gray-700',
  cancelada:  'bg-red-100 text-red-800',
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

async function cancelar(id: string) {
  await cambiarEstado(id, 'cancelada')
}

onMounted(() => loadMisCitas())
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis citas</h1>
      <BaseButton @click="router.push({ name: ROUTE_NAMES.CLIENT_NUEVA_CITA })">+ Nueva cita</BaseButton>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">Cargando…</div>

    <div v-else-if="store.citas.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">No tienes citas agendadas.</p>
      <BaseButton class="mt-4" @click="router.push({ name: ROUTE_NAMES.CLIENT_NUEVA_CITA })">Agendar ahora</BaseButton>
    </div>

    <div v-else class="space-y-4">
      <BaseCard v-for="c in store.citas" :key="c.id_cita">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-semibold text-gray-900 dark:text-white">{{ c.nombre_servicio }}</span>
              <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">{{ c.nombre_mascota }}</span> ·
              {{ formatFecha(c.fecha_hora_inicio) }}
              <span v-if="c.duracion_ajustada"> · {{ c.duracion_ajustada }} min</span>
            </p>
            <p v-if="c.nombre_trabajador" class="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              Groomer: {{ c.nombre_trabajador }}
            </p>
            <p v-if="c.notas" class="text-xs text-gray-500 italic mt-1">{{ c.notas }}</p>
          </div>

          <div class="flex-shrink-0">
            <BaseButton
              v-if="c.estado === 'pendiente'"
              variant="danger"
              size="sm"
              :disabled="store.loading"
              @click="cancelar(c.id_cita)"
            >
              Cancelar
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
