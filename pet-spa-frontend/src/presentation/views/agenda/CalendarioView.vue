<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'

interface CalendarioCita {
  id_cita:           string
  fecha_hora_inicio: string
  fecha_hora_fin:    string
  duracion_ajustada: number
  estado:            string
  nombre_cliente:    string
  nombre_mascota:    string
  nombre_servicio:   string
}
interface GroomerGroup {
  id_trabajador: string
  nombre:        string
  citas:         CalendarioCita[]
}
interface CalendarioData {
  fecha:       string
  rango:       string
  groomers:    GroomerGroup[]
  sin_groomer: CalendarioCita[]
}

const router = useRouter()
const fecha  = ref(new Date().toISOString().slice(0, 10))
const rango  = ref<'dia' | 'semana'>('dia')
const data   = ref<CalendarioData | null>(null)
const loading = ref(false)

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800', confirmada: 'bg-green-100 text-green-800',
  en_proceso: 'bg-blue-100 text-blue-800',   completada: 'bg-gray-100 text-gray-700',
  cancelada:  'bg-red-100 text-red-800',
}
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', en_proceso: 'En proceso',
  completada: 'Completada', cancelada: 'Cancelada',
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}
function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

const totalCitas = computed(() => {
  if (!data.value) return 0
  return data.value.groomers.reduce((s, g) => s + g.citas.length, 0) + data.value.sin_groomer.length
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await http.get<CalendarioData>(API_ENDPOINTS.CITAS.CALENDARIO, {
      params: { fecha: fecha.value, rango: rango.value },
    })
    data.value = res
  } catch { data.value = null }
  finally { loading.value = false }
}

function navDia(delta: number) {
  const d = new Date(fecha.value)
  d.setDate(d.getDate() + delta)
  fecha.value = d.toISOString().slice(0, 10)
  load()
}

onMounted(() => load())
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Calendario</h1>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Rango toggle -->
        <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            :class="['px-3 py-1.5 text-sm font-medium transition', rango === 'dia' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300']"
            @click="rango = 'dia'; load()">Día</button>
          <button
            :class="['px-3 py-1.5 text-sm font-medium transition', rango === 'semana' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300']"
            @click="rango = 'semana'; load()">Semana</button>
        </div>
        <!-- Nav -->
        <button class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          @click="navDia(-1)">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <input v-model="fecha" type="date"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          @change="load" />
        <button class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          @click="navDia(1)">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <BaseButton size="sm" variant="secondary" @click="navDia(0); fecha = new Date().toISOString().slice(0,10); load()">
          Hoy
        </BaseButton>
      </div>
    </div>

    <!-- Summary badge -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ rango === 'dia' ? formatFechaCorta(fecha) : `Semana desde ${formatFechaCorta(fecha)}` }}
      </span>
      <BaseBadge color="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
        {{ totalCitas }} cita{{ totalCitas !== 1 ? 's' : '' }}
      </BaseBadge>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">Cargando calendario…</div>

    <template v-else-if="data">
      <!-- Sin groomers asignados -->
      <div v-if="data.sin_groomer.length > 0" class="mb-5">
        <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Sin groomer asignado
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="c in data.sin_groomer" :key="c.id_cita"
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 cursor-pointer hover:border-primary-400 transition"
            @click="router.push({ name: ROUTE_NAMES.CITA_DETALLE, params: { id: c.id_cita } })">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{ formatHora(c.fecha_hora_inicio) }}</span>
              <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ c.nombre_cliente }}</p>
            <p class="text-xs text-gray-500">{{ c.nombre_mascota }} · {{ c.nombre_servicio }}</p>
            <p class="text-xs text-gray-400">{{ c.duracion_ajustada }} min</p>
          </div>
        </div>
      </div>

      <!-- Por groomer -->
      <div v-if="data.groomers.length > 0" class="space-y-5">
        <div v-for="g in data.groomers" :key="g.id_trabajador">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm flex-shrink-0">
              {{ g.nombre.charAt(0).toUpperCase() }}
            </div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ g.nombre }}</h2>
            <span class="text-xs text-gray-400 ml-1">{{ g.citas.length }} cita{{ g.citas.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="c in g.citas" :key="c.id_cita"
              class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 cursor-pointer hover:border-primary-400 transition"
              @click="router.push({ name: ROUTE_NAMES.CITA_DETALLE, params: { id: c.id_cita } })">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">{{ formatHora(c.fecha_hora_inicio) }}</span>
                <BaseBadge :color="ESTADO_COLOR[c.estado]">{{ ESTADO_LABEL[c.estado] }}</BaseBadge>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ c.nombre_cliente }}</p>
              <p class="text-xs text-gray-500">{{ c.nombre_mascota }} · {{ c.nombre_servicio }}</p>
              <p class="text-xs text-gray-400">{{ c.duracion_ajustada }} min</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.groomers.length === 0 && data.sin_groomer.length === 0"
        class="text-center py-16">
        <p class="text-gray-400 text-sm">No hay citas para este período.</p>
      </div>
    </template>
  </div>
</template>
