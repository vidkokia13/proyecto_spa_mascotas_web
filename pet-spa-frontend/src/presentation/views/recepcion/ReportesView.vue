<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import * as ds from '@/data/datasources/ReporteDatasource'
import type { CitaCronograma, CancelacionItem } from '@/shared/types/agenda.types'

type Tab = 'cronograma' | 'cancelaciones'
const tab     = ref<Tab>('cronograma')
const loading = ref(false)

const today      = new Date().toISOString().slice(0, 10)
const mesInicio  = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}-01`
const fechaCrono = ref(today)
const fechaIni   = ref(mesInicio)
const fechaFin   = ref(today)

const citas        = ref<CitaCronograma[]>([])
const cancelaciones = ref<CancelacionItem[]>([])
const resCancelaciones = ref({ total_canceladas: 0, con_motivo: 0 })

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'default', confirmada: 'success', en_proceso: 'info', completada: 'default',
}
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', en_proceso: 'En proceso', completada: 'Completada',
}

function fmtHora(iso: string) {
  return iso ? new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—'
}

async function cargar() {
  loading.value = true
  try {
    if (tab.value === 'cronograma') {
      const res = await ds.fetchCronograma(fechaCrono.value)
      citas.value = res.citas
    } else {
      const res = await ds.fetchCancelaciones({ fecha_inicio: fechaIni.value, fecha_fin: fechaFin.value })
      cancelaciones.value = res.cancelaciones
      resCancelaciones.value = res.resumen
    }
  } finally { loading.value = false }
}

async function cambiarTab(t: Tab) { tab.value = t; await cargar() }
onMounted(cargar)
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reportes de recepción</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Cronograma diario y cancelaciones</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="t in [{ v: 'cronograma', l: 'Cronograma del día' }, { v: 'cancelaciones', l: 'Cancelaciones' }]"
        :key="t.v"
        :class="[
          'px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px',
          tab === t.v
            ? 'border-primary-600 text-primary-700 dark:text-primary-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700',
        ]"
        @click="cambiarTab(t.v as Tab)"
      >{{ t.l }}</button>
    </div>

    <!-- Filtros -->
    <BaseCard>
      <div class="flex flex-wrap items-end gap-4">
        <template v-if="tab === 'cronograma'">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input v-model="fechaCrono" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </template>
        <template v-else>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input v-model="fechaIni" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input v-model="fechaFin" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </template>
        <button
          :disabled="loading"
          class="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          @click="cargar"
        >{{ loading ? 'Cargando...' : 'Actualizar' }}</button>
      </div>
    </BaseCard>

    <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

    <!-- ═══ CRONOGRAMA ════════════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'cronograma'">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ citas.length }} citas programadas</span>
      </div>
      <div v-if="!citas.length" class="text-center py-16 text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No hay citas para esta fecha</p>
      </div>
      <div v-else class="space-y-3">
        <BaseCard v-for="c in citas" :key="c.id_cita">
          <div class="flex items-start gap-4">
            <!-- Hora -->
            <div class="flex-shrink-0 text-center bg-primary-50 dark:bg-primary-900/20 rounded-xl px-3 py-2 min-w-[60px]">
              <p class="text-sm font-bold text-primary-700 dark:text-primary-400">{{ fmtHora(c.fecha_hora_inicio) }}</p>
              <p class="text-xs text-primary-500 dark:text-primary-500">{{ fmtHora(c.fecha_hora_fin) }}</p>
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-semibold text-gray-900 dark:text-white">{{ c.mascota }}</span>
                <BaseBadge :variant="ESTADO_COLOR[c.estado] as any" size="sm">{{ ESTADO_LABEL[c.estado] ?? c.estado }}</BaseBadge>
                <span class="text-xs text-gray-400 capitalize">{{ c.tamano }}</span>
                <span v-if="c.temperamento" class="text-xs text-gray-400">· {{ c.temperamento }}</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ c.servicio }}</p>
              <div class="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>👤 {{ c.cliente }}</span>
                <span>✂️ {{ c.groomer }}</span>
                <a v-if="c.email_cliente" :href="`mailto:${c.email_cliente}`" class="text-primary-600 hover:underline">{{ c.email_cliente }}</a>
              </div>
              <p v-if="c.notas" class="text-xs text-gray-400 italic mt-1">{{ c.notas }}</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- ═══ CANCELACIONES ═════════════════════════════════════════════════════ -->
    <template v-else>
      <div class="grid grid-cols-2 gap-4 mb-2">
        <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-4">
          <p class="text-xs text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">Total canceladas</p>
          <p class="text-3xl font-bold text-red-700 dark:text-red-300">{{ resCancelaciones.total_canceladas }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Con motivo registrado</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ resCancelaciones.con_motivo }}</p>
        </div>
      </div>

      <BaseCard>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Mascota</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Servicio</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in cancelaciones" :key="c.id_cita"
                class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ c.fecha_cita }}</td>
                <td class="py-3 px-4">
                  <p class="font-medium text-gray-900 dark:text-white">{{ c.cliente }}</p>
                  <p class="text-xs text-gray-400">{{ c.email_cliente }}</p>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">{{ c.mascota }}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">{{ c.servicio }}</td>
                <td class="py-3 px-4">
                  <span v-if="c.motivo_cancelacion" class="text-xs text-red-600 dark:text-red-400 capitalize">{{ c.motivo_cancelacion }}</span>
                  <span v-else class="text-xs text-gray-400 italic">Sin motivo</span>
                </td>
              </tr>
              <tr v-if="!cancelaciones.length">
                <td colspan="5" class="text-center py-10 text-gray-400">No hay cancelaciones en este período</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
