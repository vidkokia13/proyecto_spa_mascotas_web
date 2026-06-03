<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseCard  from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import * as ds from '@/data/datasources/NotificacionDatasource'
import type {
  NotificacionEnviada,
  NotifStatItem,
  TipoNotificacion,
} from '@/shared/types/agenda.types'

// ── Estado ────────────────────────────────────────────────────────────────────

const loading      = ref(false)
const items        = ref<NotificacionEnviada[]>([])
const total        = ref(0)
const statsHoy     = ref<NotifStatItem[]>([])
const statsHistorico = ref<NotifStatItem[]>([])

const fecha    = ref(new Date().toISOString().slice(0, 10))
const filtroTipo = ref<TipoNotificacion | ''>('')
const page     = ref(0)
const PAGE_SIZE = 20

// ── Labels y helpers ──────────────────────────────────────────────────────────

const TIPO_META: Record<TipoNotificacion, { label: string; variant: string; icon: string; desc: string }> = {
  recordatorio_24h: { label: 'Recordatorio 24h', variant: 'info',    icon: '📅', desc: 'Enviado 24 h antes de la cita' },
  recordatorio_2h:  { label: 'Recordatorio 2h',  variant: 'warning', icon: '⏰', desc: 'Enviado 2 h antes de la cita' },
  bajo_stock:       { label: 'Bajo stock',        variant: 'error',   icon: '📦', desc: 'Producto por debajo del mínimo' },
}

const TIPOS: { v: TipoNotificacion | ''; l: string }[] = [
  { v: '',                l: 'Todas'          },
  { v: 'recordatorio_24h', l: 'Recordatorio 24h' },
  { v: 'recordatorio_2h',  l: 'Recordatorio 2h'  },
  { v: 'bajo_stock',       l: 'Bajo stock'     },
]

function statHoy(tipo: TipoNotificacion): number {
  return statsHoy.value.find(s => s.tipo === tipo)?.total ?? 0
}
function statTotal(tipo: TipoNotificacion): number {
  return statsHistorico.value.find(s => s.tipo === tipo)?.total ?? 0
}

const totalHoy = computed(() => statsHoy.value.reduce((a, s) => a + s.total, 0))

// ── Carga de datos ────────────────────────────────────────────────────────────

async function cargar() {
  loading.value = true
  try {
    const [lista, st] = await Promise.all([
      ds.fetchNotificaciones({
        tipo:   filtroTipo.value || undefined,
        fecha:  fecha.value,
        limit:  PAGE_SIZE,
        offset: page.value * PAGE_SIZE,
      }),
      ds.fetchStats(fecha.value),
    ])
    items.value          = lista.notificaciones
    total.value          = lista.total
    statsHoy.value       = st.hoy
    statsHistorico.value = st.historico
  } finally {
    loading.value = false
  }
}

const totalPaginas = computed(() => Math.ceil(total.value / PAGE_SIZE))

function irPagina(n: number) {
  page.value = n
}

// Re-cargar cuando cambian filtros
watch([fecha, filtroTipo], () => { page.value = 0; cargar() })
watch(page, cargar)

onMounted(cargar)

// ── Formato fecha ─────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="p-6 space-y-6">

    <!-- Cabecera -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        Historial de emails enviados automáticamente por el sistema
      </p>
    </div>

    <!-- Cards de estadísticas del día -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total hoy -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total hoy</span>
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalHoy }}</span>
        <span class="text-xs text-gray-400">{{ fecha }}</span>
      </div>

      <!-- Recordatorio 24h -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-4 flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="text-lg">📅</span>
          <span class="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Recordatorio 24h</span>
        </div>
        <span class="text-3xl font-bold text-blue-700 dark:text-blue-300">{{ statHoy('recordatorio_24h') }}</span>
        <span class="text-xs text-blue-500 dark:text-blue-400">{{ statTotal('recordatorio_24h') }} totales</span>
      </div>

      <!-- Recordatorio 2h -->
      <div class="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 p-4 flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="text-lg">⏰</span>
          <span class="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Recordatorio 2h</span>
        </div>
        <span class="text-3xl font-bold text-amber-700 dark:text-amber-300">{{ statHoy('recordatorio_2h') }}</span>
        <span class="text-xs text-amber-500 dark:text-amber-400">{{ statTotal('recordatorio_2h') }} totales</span>
      </div>

      <!-- Bajo stock -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-4 flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <span class="text-lg">📦</span>
          <span class="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">Bajo stock</span>
        </div>
        <span class="text-3xl font-bold text-red-700 dark:text-red-300">{{ statHoy('bajo_stock') }}</span>
        <span class="text-xs text-red-500 dark:text-red-400">{{ statTotal('bajo_stock') }} totales</span>
      </div>
    </div>

    <!-- Filtros -->
    <BaseCard>
      <div class="flex flex-wrap items-center gap-4">
        <!-- Fecha -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha:</label>
          <input
            v-model="fecha" type="date"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Tipo -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in TIPOS" :key="t.v"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition',
              filtroTipo === t.v
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="filtroTipo = t.v"
          >{{ t.l }}</button>
        </div>
      </div>
    </BaseCard>

    <!-- Tabla -->
    <BaseCard>
      <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Enviado a</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Referencia</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="n in items" :key="n.id"
                class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                <!-- Tipo -->
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ TIPO_META[n.tipo]?.icon }}</span>
                    <div>
                      <BaseBadge
                        :variant="TIPO_META[n.tipo]?.variant as any"
                        size="sm"
                      >{{ TIPO_META[n.tipo]?.label }}</BaseBadge>
                      <p class="text-xs text-gray-400 mt-0.5">{{ TIPO_META[n.tipo]?.desc }}</p>
                    </div>
                  </div>
                </td>

                <!-- Enviado a -->
                <td class="py-3 px-4">
                  <span v-if="n.enviado_a" class="text-gray-700 dark:text-gray-300">{{ n.enviado_a }}</span>
                  <span v-else class="text-gray-400 italic text-xs">—</span>
                </td>

                <!-- Referencia (ID truncado) -->
                <td class="py-3 px-4">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {{ n.referencia_id.length > 12 ? '…' + n.referencia_id.slice(-8) : n.referencia_id }}
                  </span>
                </td>

                <!-- Fecha -->
                <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {{ fmtFecha(n.enviado_en) }}
                </td>
              </tr>

              <!-- Vacío -->
              <tr v-if="items.length === 0">
                <td colspan="4" class="text-center py-14">
                  <div class="flex flex-col items-center gap-3 text-gray-400">
                    <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p class="text-sm">No hay notificaciones para este filtro</p>
                    <p class="text-xs">Los recordatorios se envían automáticamente cuando hay citas programadas</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {{ page * PAGE_SIZE + 1 }}–{{ Math.min((page + 1) * PAGE_SIZE, total) }} de {{ total }}
          </span>
          <div class="flex gap-1">
            <button
              v-for="p in totalPaginas" :key="p"
              :class="[
                'w-8 h-8 rounded-lg text-xs font-medium transition',
                page === p - 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
              ]"
              @click="irPagina(p - 1)"
            >{{ p }}</button>
          </div>
        </div>
      </template>
    </BaseCard>

    <!-- Info del scheduler -->
    <BaseCard>
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Scheduler activo</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recordatorio 24h → corre cada 30 minutos ·
            Recordatorio 2h → corre cada 15 minutos ·
            Bajo stock → se dispara al registrar una venta
          </p>
        </div>
      </div>
    </BaseCard>

  </div>
</template>
