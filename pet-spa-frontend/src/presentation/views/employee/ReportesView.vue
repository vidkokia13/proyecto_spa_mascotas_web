<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import * as ds from '@/data/datasources/ReporteDatasource'
import type { ProductividadGroomer, InsumoGroomer } from '@/shared/types/agenda.types'

type Tab = 'productividad' | 'insumos'
const tab     = ref<Tab>('productividad')
const loading = ref(false)

const today      = new Date().toISOString().slice(0, 10)
const mesInicio  = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}-01`
const fechaIni   = ref(mesInicio)
const fechaFin   = ref(today)

const miProd   = ref<ProductividadGroomer | null>(null)
const insumos  = ref<InsumoGroomer[]>([])
const resInsumos = ref({ tipos_insumos: 0, citas_con_insumos: 0 })
const periodo  = ref({ inicio: '', fin: '' })

async function cargar() {
  loading.value = true
  try {
    const p = { fecha_inicio: fechaIni.value, fecha_fin: fechaFin.value }
    if (tab.value === 'productividad') {
      const res = await ds.fetchProductividad(p)
      miProd.value = res.groomers[0] ?? null
      periodo.value = res.periodo
    } else {
      const res = await ds.fetchMisInsumos(p)
      insumos.value = res.insumos
      resInsumos.value = res.resumen
      periodo.value = res.periodo
    }
  } finally { loading.value = false }
}

async function cambiarTab(t: Tab) { tab.value = t; await cargar() }
onMounted(cargar)

const bs = (n: number | string) => `Bs ${Number(n).toFixed(2)}`
const pct = (n: number | null) => n != null ? `${n}%` : '—'
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis reportes</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Productividad y consumo de insumos</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="t in [{ v: 'productividad', l: 'Mi productividad' }, { v: 'insumos', l: 'Mis insumos' }]"
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

    <!-- Filtro fechas -->
    <BaseCard>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input v-model="fechaIni" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input v-model="fechaFin" type="date" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button
          :disabled="loading"
          class="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          @click="cargar"
        >{{ loading ? 'Cargando...' : 'Actualizar' }}</button>
      </div>
    </BaseCard>

    <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

    <!-- ═══ PRODUCTIVIDAD ══════════════════════════════════════════════════════ -->
    <template v-else-if="tab === 'productividad'">
      <div v-if="!miProd" class="text-center py-12 text-gray-400">Sin datos para este período</div>
      <template v-else>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Citas totales</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ miProd.total_citas }}</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-4">
            <p class="text-xs text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Completadas</p>
            <p class="text-3xl font-bold text-green-700 dark:text-green-300">{{ miProd.completadas }}</p>
            <p class="text-xs text-green-500 mt-0.5">{{ pct(miProd.tasa_completadas_pct) }}</p>
          </div>
          <div class="bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 p-4">
            <p class="text-xs text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-1">Ingresos generados</p>
            <p class="text-2xl font-bold text-primary-700 dark:text-primary-300">{{ bs(miProd.ingresos_generados) }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Duración prom.</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ miProd.duracion_promedio_min ?? '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">minutos</p>
          </div>
        </div>

        <BaseCard>
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xl font-black">
              {{ miProd.groomer.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ miProd.groomer }}</p>
              <p class="text-sm text-gray-500">Período: {{ periodo.inicio }} — {{ periodo.fin }}</p>
              <p class="text-sm text-gray-500">{{ miProd.canceladas }} canceladas · {{ miProd.completadas }} completadas</p>
            </div>
          </div>
        </BaseCard>
      </template>
    </template>

    <!-- ═══ INSUMOS ════════════════════════════════════════════════════════════ -->
    <template v-else>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipos de insumos</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ resInsumos.tipos_insumos }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Citas con insumos</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ resInsumos.citas_con_insumos }}</p>
        </div>
      </div>

      <BaseCard>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Insumo</th>
                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Citas</th>
                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Total usado</th>
                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Prom./cita</th>
                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Desperdicio</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="i in insumos" :key="i.id_insumo"
                class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td class="py-3 px-4">
                  <p class="font-medium text-gray-900 dark:text-white">{{ i.insumo }}</p>
                  <p class="text-xs text-gray-400">{{ i.unidad }}</p>
                </td>
                <td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{{ i.num_citas }}</td>
                <td class="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{{ Number(i.total_usado).toFixed(2) }}</td>
                <td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{{ Number(i.promedio_por_cita).toFixed(2) }}</td>
                <td class="py-3 px-4 text-right text-amber-600 dark:text-amber-400">{{ Number(i.total_desperdicio).toFixed(2) }}</td>
              </tr>
              <tr v-if="!insumos.length">
                <td colspan="5" class="text-center py-10 text-gray-400">Sin insumos registrados en este período</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
