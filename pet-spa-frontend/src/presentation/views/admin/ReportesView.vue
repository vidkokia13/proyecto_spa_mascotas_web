<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseCard  from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import * as ds from '@/data/datasources/ReporteDatasource'
import type { VentasReporte, OcupacionReporte, NpsReporte } from '@/shared/types/agenda.types'

// ── Estado global ─────────────────────────────────────────────────────────────
type Tab = 'ventas' | 'ocupacion' | 'nps'
const tab   = ref<Tab>('ventas')
const loading = ref(false)

// Rango de fechas (default: mes en curso)
const today = new Date()
const mesInicio = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
const fechaIni  = ref(mesInicio)
const fechaFin  = ref(today.toISOString().slice(0, 10))

// ── Datos ─────────────────────────────────────────────────────────────────────
const ventas   = ref<VentasReporte | null>(null)
const ocupacion = ref<OcupacionReporte | null>(null)
const nps      = ref<NpsReporte | null>(null)

async function cargar() {
  loading.value = true
  try {
    const p = { fecha_inicio: fechaIni.value, fecha_fin: fechaFin.value }
    if (tab.value === 'ventas')   ventas.value    = await ds.fetchVentas(p)
    if (tab.value === 'ocupacion') ocupacion.value = await ds.fetchOcupacion(p)
    if (tab.value === 'nps')      nps.value       = await ds.fetchNps(p)
  } finally { loading.value = false }
}

async function cambiarTab(t: Tab) { tab.value = t; await cargar() }
onMounted(cargar)

// ── Helpers ───────────────────────────────────────────────────────────────────
const bs = (n: number | string) => `Bs ${Number(n).toFixed(2)}`
const pct = (n: number | null) => n != null ? `${n}%` : '—'

function barWidth(val: number, max: number): string {
  return max > 0 ? `${Math.round((val / max) * 100)}%` : '0%'
}

const maxRanking = computed(() =>
  Math.max(1, ...(ventas.value?.rankingServicios.map(r => Number(r.ingresos)) ?? []))
)
const maxDia = computed(() =>
  Math.max(1, ...(ocupacion.value?.porDia.map(d => d.total) ?? []))
)
const maxDistNps = computed(() =>
  Math.max(1, ...(nps.value?.distribucion.map(d => d.cantidad) ?? []))
)

const ESTRELLAS = [5, 4, 3, 2, 1]
const CAT_LABELS: Record<string, string> = {
  bano: 'Baño', corte: 'Corte', spa: 'Spa', veterinaria: 'Vet.',
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Cabecera -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Análisis de rendimiento del negocio</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="t in [{ v: 'ventas', l: 'Ventas' }, { v: 'ocupacion', l: 'Ocupación' }, { v: 'nps', l: 'Satisfacción' }]"
        :key="t.v"
        :class="[
          'px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px',
          tab === t.v
            ? 'border-primary-600 text-primary-700 dark:text-primary-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
        @click="cambiarTab(t.v as Tab)"
      >{{ t.l }}</button>
    </div>

    <!-- Filtro de fechas -->
    <BaseCard>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
          <input v-model="fechaIni" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
          <input v-model="fechaFin" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <BaseButton :disabled="loading" @click="cargar">{{ loading ? 'Cargando...' : 'Actualizar' }}</BaseButton>
      </div>
    </BaseCard>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Generando reporte...</div>

    <!-- ═══ TAB VENTAS ════════════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'ventas' && ventas">
      <!-- Resumen cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Ingresos netos</p>
          <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ bs(ventas.resumen.total_neto) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ bs(ventas.resumen.total_bruto) }} bruto</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Citas pagadas</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ ventas.resumen.total_citas_pagadas }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ ventas.resumen.total_pagos }} pagos</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Descuentos</p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ bs(ventas.resumen.total_descuentos) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-4">
          <p class="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Tienda</p>
          <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ bs(ventas.resumen.total_tienda) }}</p>
          <p class="text-xs text-green-500 mt-0.5">{{ ventas.resumen.total_ventas_tienda }} ventas</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Ranking de servicios -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Ranking de servicios</h3>
          <div v-if="ventas.rankingServicios.length === 0" class="text-center py-6 text-sm text-gray-400">Sin datos</div>
          <div v-else class="space-y-3">
            <div v-for="(s, i) in ventas.rankingServicios" :key="s.id_servicio">
              <div class="flex items-center justify-between text-sm mb-1">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-xs font-bold text-gray-400 w-4">{{ i + 1 }}</span>
                  <span class="font-medium text-gray-900 dark:text-white truncate">{{ s.servicio }}</span>
                  <span class="text-xs text-gray-400">{{ s.num_citas }} citas</span>
                </div>
                <span class="font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">{{ bs(s.ingresos) }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-primary-500 rounded-full" :style="{ width: barWidth(Number(s.ingresos), maxRanking) }" />
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Métodos de pago -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Por método de pago</h3>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Citas</p>
          <div class="space-y-2 mb-4">
            <div v-for="m in ventas.porMetodoCitas" :key="m.metodo" class="flex items-center justify-between text-sm">
              <span class="capitalize text-gray-700 dark:text-gray-300">{{ m.metodo }} <span class="text-gray-400">({{ m.cantidad }})</span></span>
              <span class="font-semibold">{{ bs(m.total) }}</span>
            </div>
            <div v-if="!ventas.porMetodoCitas.length" class="text-xs text-gray-400">Sin datos</div>
          </div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tienda</p>
          <div class="space-y-2">
            <div v-for="m in ventas.porMetodoTienda" :key="m.metodo" class="flex items-center justify-between text-sm">
              <span class="capitalize text-gray-700 dark:text-gray-300">{{ m.metodo }} <span class="text-gray-400">({{ m.cantidad }})</span></span>
              <span class="font-semibold text-green-600">{{ bs(m.total) }}</span>
            </div>
            <div v-if="!ventas.porMetodoTienda.length" class="text-xs text-gray-400">Sin datos</div>
          </div>
        </BaseCard>
      </div>

      <!-- Tendencia diaria -->
      <BaseCard v-if="ventas.tendenciaDiaria.length">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Tendencia diaria</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Pagos</th>
                <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in ventas.tendenciaDiaria" :key="d.fecha" class="border-b border-gray-50 dark:border-gray-800">
                <td class="py-2 px-3 text-gray-700 dark:text-gray-300">{{ d.fecha }}</td>
                <td class="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{{ d.pagos }}</td>
                <td class="py-2 px-3 text-right font-semibold text-primary-600 dark:text-primary-400">{{ bs(d.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </template>

    <!-- ═══ TAB OCUPACIÓN ═════════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'ocupacion' && ocupacion">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total citas</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ ocupacion.resumen.total_citas }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-4">
          <p class="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Completadas</p>
          <p class="text-3xl font-bold text-green-700 dark:text-green-300">{{ ocupacion.resumen.completadas }}</p>
          <p class="text-xs text-green-500 mt-0.5">{{ pct(ocupacion.resumen.tasa_completadas_pct) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-4">
          <p class="text-xs text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">Canceladas</p>
          <p class="text-3xl font-bold text-red-700 dark:text-red-300">{{ ocupacion.resumen.canceladas }}</p>
          <p class="text-xs text-red-500 mt-0.5">{{ pct(ocupacion.resumen.tasa_cancelacion_pct) }}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-4">
          <p class="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Activas</p>
          <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ ocupacion.resumen.activas }}</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Por groomer -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Por groomer</h3>
          <div class="space-y-3">
            <div v-for="g in ocupacion.porGroomer" :key="g.groomer">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-gray-900 dark:text-white">{{ g.groomer }}</span>
                <span class="text-gray-500">{{ g.completadas }}/{{ g.total }} — {{ pct(g.tasa_pct) }}</span>
              </div>
              <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full" :style="{ width: pct(g.tasa_pct) }" />
              </div>
            </div>
            <div v-if="!ocupacion.porGroomer.length" class="text-center py-4 text-sm text-gray-400">Sin datos</div>
          </div>
        </BaseCard>

        <!-- Por día (tabla) -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Detalle por día</h3>
          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-white dark:bg-gray-800">
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-green-600">✓</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 text-red-500">✗</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in ocupacion.porDia" :key="d.fecha" class="border-b border-gray-50 dark:border-gray-800">
                  <td class="py-2 px-3 text-gray-700 dark:text-gray-300">{{ d.fecha }}</td>
                  <td class="py-2 px-3 text-right font-medium">{{ d.total }}</td>
                  <td class="py-2 px-3 text-right text-green-600">{{ d.completadas }}</td>
                  <td class="py-2 px-3 text-right text-red-500">{{ d.canceladas }}</td>
                </tr>
                <tr v-if="!ocupacion.porDia.length">
                  <td colspan="4" class="text-center py-6 text-gray-400">Sin datos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- ═══ TAB NPS ═══════════════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'nps' && nps">
      <!-- Score central -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">NPS Score</p>
          <p :class="[
            'text-5xl font-black',
            Number(nps.resumen.nps) >= 50 ? 'text-green-600 dark:text-green-400'
            : Number(nps.resumen.nps) >= 0 ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          ]">{{ nps.resumen.nps ?? '—' }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ nps.resumen.total_calificaciones }} reseñas</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-4 flex flex-col items-center">
          <p class="text-xs text-green-700 dark:text-green-300 mb-1">Promotores ≥4★</p>
          <p class="text-3xl font-bold text-green-700 dark:text-green-300">{{ nps.resumen.promotores }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center">
          <p class="text-xs text-gray-500 mb-1">Pasivos 3★</p>
          <p class="text-3xl font-bold text-gray-700 dark:text-gray-300">{{ nps.resumen.pasivos }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-4 flex flex-col items-center">
          <p class="text-xs text-red-700 dark:text-red-300 mb-1">Detractores ≤2★</p>
          <p class="text-3xl font-bold text-red-700 dark:text-red-300">{{ nps.resumen.detractores }}</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Distribución -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Distribución de puntuaciones</h3>
          <div class="space-y-3">
            <div v-for="e in ESTRELLAS" :key="e">
              <div class="flex items-center gap-3">
                <div class="flex gap-0.5 w-20 flex-shrink-0">
                  <span v-for="i in 5" :key="i" :class="i <= e ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'" class="text-sm">★</span>
                </div>
                <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-400 rounded-full transition-all"
                    :style="{ width: barWidth(nps.distribucion.find(d => d.puntuacion === e)?.cantidad ?? 0, maxDistNps) }"
                  />
                </div>
                <span class="text-sm text-gray-500 w-6 text-right">{{ nps.distribucion.find(d => d.puntuacion === e)?.cantidad ?? 0 }}</span>
              </div>
            </div>
            <div v-if="!nps.distribucion.length" class="text-center py-4 text-sm text-gray-400">Sin calificaciones</div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
            <span class="text-gray-500">Promedio</span>
            <div class="flex items-center gap-2">
              <span class="text-amber-400">★</span>
              <span class="font-bold text-gray-900 dark:text-white">{{ nps.resumen.promedio ?? '—' }}</span>
              <span class="text-gray-400">/ 5</span>
            </div>
          </div>
        </BaseCard>

        <!-- Reseñas recientes -->
        <BaseCard>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Reseñas recientes</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto">
            <div
              v-for="r in nps.recientes" :key="r.creado_en"
              class="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ r.cliente }}</span>
                <span class="text-xs text-gray-400">{{ new Date(r.creado_en).toLocaleDateString('es-BO') }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-1">{{ r.mascota }} · {{ r.servicio }}</p>
              <div class="flex gap-0.5 mb-1">
                <span v-for="i in 5" :key="i" :class="i <= r.puntuacion ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'" class="text-xs">★</span>
              </div>
              <p v-if="r.comentario" class="text-xs text-gray-600 dark:text-gray-400 italic">"{{ r.comentario }}"</p>
            </div>
            <div v-if="!nps.recientes.length" class="text-center py-4 text-sm text-gray-400">Sin reseñas</div>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
