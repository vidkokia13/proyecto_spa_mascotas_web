<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCitas } from '@/presentation/composables/useCitas'
import { useAuthStore } from '@/presentation/stores/auth.store'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { EstadoCita, Cita } from '@/shared/types/agenda.types'

const authStore = useAuthStore()
const router    = useRouter()
const { store, loadRango, cambiarEstado } = useCitas()

const role = computed(() => authStore.userRole ?? '')

const fechaInicio = ref(new Date().toISOString().slice(0, 10))
const fechaFin    = ref(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
const filterEstado = ref<EstadoCita | ''>('')

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

const TRANSITIONS: Record<string, Record<string, EstadoCita[]>> = {
  trabajador: {
    pendiente:  ['confirmada', 'en_proceso', 'cancelada'],
    confirmada: ['en_proceso', 'cancelada'],
    en_proceso: ['completada'],
  },
  recepcion: {
    pendiente:  ['confirmada', 'cancelada'],
    confirmada: ['cancelada'],
  },
  admin: {
    pendiente:  ['confirmada', 'cancelada'],
    confirmada: ['en_proceso', 'cancelada'],
    en_proceso: ['completada'],
  },
  jefe: {
    pendiente:  ['confirmada', 'cancelada'],
    confirmada: ['en_proceso', 'cancelada'],
    en_proceso: ['completada'],
  },
}

function allowedTransitions(cita: Cita): EstadoCita[] {
  return TRANSITIONS[role.value]?.[cita.estado] ?? []
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

async function load() {
  await loadRango({
    fechaInicio: fechaInicio.value,
    fechaFin:    fechaFin.value,
    estado:      filterEstado.value || undefined,
  })
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agenda de citas</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Desde</label>
        <input v-model="fechaInicio" type="date"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
        <input v-model="fechaFin" type="date"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Estado</label>
        <select v-model="filterEstado"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
          <option value="">Todos</option>
          <option v-for="(label, val) in ESTADO_LABEL" :key="val" :value="val">{{ label }}</option>
        </select>
      </div>
      <BaseButton size="sm" @click="load">Buscar</BaseButton>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-400">Cargando…</div>

    <div v-else-if="store.citas.length === 0" class="text-center py-16">
      <p class="text-gray-500">No hay citas en el rango seleccionado.</p>
    </div>

    <div v-else class="space-y-3">
      <BaseCard v-for="c in store.citas" :key="c.id_cita">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
              <span class="font-semibold text-gray-900 dark:text-white">{{ c.nombre_servicio }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">{{ c.nombre_cliente }}</span>
              <span class="mx-1">·</span>
              {{ c.nombre_mascota }}
              <span class="mx-1">·</span>
              {{ formatFecha(c.fecha_hora_inicio) }}
              <span v-if="c.duracion_ajustada" class="mx-1">· {{ c.duracion_ajustada }} min</span>
            </p>
            <p v-if="c.nombre_trabajador" class="text-xs text-gray-500 mt-0.5">
              Groomer: {{ c.nombre_trabajador }}
            </p>
            <p v-if="c.notas" class="text-xs text-gray-500 italic mt-1">{{ c.notas }}</p>
          </div>

          <div class="flex gap-2 flex-wrap">
            <BaseButton
              v-for="next in allowedTransitions(c)"
              :key="next"
              size="sm"
              :variant="next === 'cancelada' ? 'danger' : next === 'completada' ? 'secondary' : 'primary'"
              :disabled="store.loading"
              @click="cambiarEstado(c.id_cita, next)"
            >
              {{ ESTADO_LABEL[next] }}
            </BaseButton>
            <BaseButton size="sm" variant="secondary"
              @click="router.push({ name: ROUTE_NAMES.CITA_DETALLE, params: { id: c.id_cita } })">
              Ver detalle
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
