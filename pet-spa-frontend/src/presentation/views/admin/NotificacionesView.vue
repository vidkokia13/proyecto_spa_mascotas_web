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

const loading        = ref(false)
const errorMsg       = ref<string | null>(null)
const items          = ref<NotificacionEnviada[]>([])
const total          = ref(0)
const statsHoy       = ref<NotifStatItem[]>([])
const statsHistorico = ref<NotifStatItem[]>([])

// Estado para prueba de email
const probando     = ref(false)
const resultadoPrueba = ref<{
  ok: boolean
  smtp: { ok: boolean; error: string | null; messageId: string | null }
  db:   { ok: boolean; error: string | null; tablaExiste: boolean }
} | null>(null)

// Estado para verificación de stock
const verificandoStock  = ref(false)
const resultadoStock    = ref<{
  ok: boolean; verificados: number; enviados: number; mensaje?: string
  productos?: { nombre: string; stock: number; minimo: number }[]
  error?: string
} | null>(null)

const fecha      = ref('')   // vacío = todas las fechas
const filtroTipo = ref<TipoNotificacion | ''>('')
const page       = ref(0)
const PAGE_SIZE  = 20

// ── Labels y helpers ──────────────────────────────────────────────────────────

const TIPO_META: Record<string, { label: string; variant: string; icon: string; desc: string }> = {
  recordatorio_24h:      { label: 'Recordatorio 24h',    variant: 'info',    icon: '📅', desc: '24 h antes de la cita' },
  recordatorio_2h:       { label: 'Recordatorio 2h',     variant: 'warning', icon: '⏰', desc: '2 h antes de la cita' },
  bajo_stock:            { label: 'Bajo stock',           variant: 'error',   icon: '📦', desc: 'Stock por debajo del mínimo' },
  cita_confirmada:       { label: 'Cita confirmada',      variant: 'success', icon: '✅', desc: 'Cita confirmada por recepción' },
  cita_cancelada:        { label: 'Cita cancelada',       variant: 'error',   icon: '❌', desc: 'Cita cancelada por interno' },
  cita_cancelada_cliente:{ label: 'Cancelada por cliente',variant: 'error',   icon: '🚫', desc: 'Cliente canceló su cita' },
  cita_completada:       { label: 'Servicio completado',  variant: 'success', icon: '🐾', desc: 'Mascota lista para recoger' },
  cita_reprogramada:     { label: 'Reprogramada',         variant: 'info',    icon: '📆', desc: 'Cita movida a nueva fecha' },
}

const TIPOS: { v: TipoNotificacion | ''; l: string }[] = [
  { v: '',                  l: 'Todas'                },
  { v: 'cita_confirmada',   l: 'Cita confirmada'      },
  { v: 'cita_completada',   l: 'Servicio completado'  },
  { v: 'cita_cancelada',    l: 'Cita cancelada'       },
  { v: 'cita_cancelada_cliente', l: 'Cancelada cliente' },
  { v: 'cita_reprogramada', l: 'Reprogramada'         },
  { v: 'recordatorio_24h',  l: 'Recordatorio 24h'     },
  { v: 'recordatorio_2h',   l: 'Recordatorio 2h'      },
  { v: 'bajo_stock',        l: 'Bajo stock'           },
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
  errorMsg.value = null
  try {
    const [lista, st] = await Promise.all([
      ds.fetchNotificaciones({
        tipo:   filtroTipo.value || undefined,
        fecha:  fecha.value || undefined,   // undefined = sin filtro de fecha
        limit:  PAGE_SIZE,
        offset: page.value * PAGE_SIZE,
      }),
      ds.fetchStats(fecha.value || undefined),
    ])
    items.value          = lista.notificaciones
    total.value          = lista.total
    statsHoy.value       = st.hoy
    statsHistorico.value = st.historico
  } catch (e: any) {
    errorMsg.value = e.message?.includes('notificaciones_enviadas')
      ? 'Tabla de notificaciones no existe. Ejecuta 16_pending_migrations.sql en la BD.'
      : (e.message ?? 'Error al cargar notificaciones')
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

async function verificarStock() {
  verificandoStock.value = true
  resultadoStock.value = null
  try {
    const r = await ds.checkStock()
    resultadoStock.value = r
    if (r.enviados > 0) setTimeout(cargar, 800)
  } catch (e: any) {
    resultadoStock.value = { ok: false, verificados: 0, enviados: 0, error: e.message }
  } finally {
    verificandoStock.value = false
  }
}

async function probarEnvio() {
  probando.value = true
  resultadoPrueba.value = null
  try {
    const r = await ds.probarEnvio()
    resultadoPrueba.value = { ok: r.ok, ...r.resultado }
    if (r.ok) setTimeout(cargar, 1000) // refrescar la lista si se insertó en DB
  } catch (e: any) {
    resultadoPrueba.value = {
      ok: false,
      smtp: { ok: false, error: e.message, messageId: null },
      db:   { ok: false, error: null, tablaExiste: false },
    }
  } finally {
    probando.value = false
  }
}

// ── Helper para color del badge ───────────────────────────────────────────────

function badgeColor(variant?: string): string {
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    error:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[variant ?? 'default'] ?? map.default
}

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
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Historial de emails enviados automáticamente por el sistema
        </p>
      </div>
      <div class="flex gap-2">
        <button
          :disabled="verificandoStock"
          class="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          @click="verificarStock"
        >{{ verificandoStock ? 'Verificando...' : '📦 Verificar stock bajo' }}</button>
        <button
          :disabled="loading"
          class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
          @click="cargar"
        >↺ Actualizar</button>
      </div>
    </div>

    <!-- Error de tabla -->
    <div v-if="errorMsg" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
      ❌ {{ errorMsg }}
    </div>

    <!-- Resultado verificación de stock -->
    <div v-if="resultadoStock" :class="[
      'rounded-xl p-4 text-sm border',
      resultadoStock.ok
        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    ]">
      <!-- Sin productos con stock bajo -->
      <template v-if="resultadoStock.ok && resultadoStock.verificados === 0">
        <p class="font-medium">✅ {{ resultadoStock.mensaje ?? 'No hay productos con stock bajo.' }}</p>
      </template>

      <!-- Resultados normales -->
      <template v-else-if="resultadoStock.verificados > 0">
        <p class="font-medium mb-2">
          📦 {{ resultadoStock.verificados }} productos con stock bajo —
          {{ resultadoStock.enviados }} notificación(es) enviada(s)
        </p>
        <ul class="space-y-1">
          <li v-for="p in resultadoStock.productos" :key="p.nombre" class="text-xs flex items-center gap-2">
            <span :class="[
              'inline-block w-2 h-2 rounded-full flex-shrink-0',
              p.stock === 0 ? 'bg-red-500' : 'bg-amber-500'
            ]" />
            <strong>{{ p.nombre }}</strong>
            <span class="opacity-75">stock: {{ p.stock }} / mínimo: {{ p.minimo }}</span>
          </li>
        </ul>
        <!-- Errores SMTP si los hay -->
        <div v-if="resultadoStock.errores?.length" class="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
          <p class="font-medium text-red-700 dark:text-red-300 mb-1">⚠️ Errores al enviar:</p>
          <ul class="space-y-0.5">
            <li v-for="e in resultadoStock.errores" :key="e.producto" class="text-xs text-red-600 dark:text-red-400">
              {{ e.producto }}: {{ e.error }}
            </li>
          </ul>
          <p class="text-xs mt-2 opacity-75">Revisa la configuración SMTP en el archivo .env del servidor.</p>
        </div>
      </template>

      <!-- Error de admins no encontrados u otro error -->
      <template v-else>
        <p class="font-medium">❌ {{ resultadoStock.mensaje ?? resultadoStock.error ?? 'Error al verificar stock' }}</p>
      </template>
    </div>

    <!-- Cards de estadísticas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total registradas</span>
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ statsHistorico.reduce((a,s)=>a+s.total,0) }}</span>
        <span class="text-xs text-gray-400">{{ fecha || 'Todas las fechas' }}</span>
      </div>

      <!-- Citas confirmadas/completadas -->
      <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-5 flex flex-col gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-base">✅🐾</span>
          <span class="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Citas</span>
        </div>
        <span class="text-3xl font-bold text-green-700 dark:text-green-300">
          {{ (statTotal('cita_confirmada') + statTotal('cita_completada')) }}
        </span>
        <span class="text-xs text-green-500">confirmadas + completadas</span>
      </div>

      <!-- Cancelaciones -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-5 flex flex-col gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-base">❌🚫</span>
          <span class="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">Canceladas</span>
        </div>
        <span class="text-3xl font-bold text-red-700 dark:text-red-300">
          {{ (statTotal('cita_cancelada') + statTotal('cita_cancelada_cliente')) }}
        </span>
        <span class="text-xs text-red-500">por interno + cliente</span>
      </div>

      <!-- Recordatorios + bajo stock -->
      <div class="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 p-5 flex flex-col gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-base">⏰📦</span>
          <span class="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Automáticas</span>
        </div>
        <span class="text-3xl font-bold text-amber-700 dark:text-amber-300">
          {{ (statTotal('recordatorio_24h') + statTotal('recordatorio_2h') + statTotal('bajo_stock')) }}
        </span>
        <span class="text-xs text-amber-500">recordatorios + bajo stock</span>
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
          <button
            v-if="fecha"
            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
            @click="fecha = ''"
          >Todas las fechas</button>
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
                      <BaseBadge :color="badgeColor(TIPO_META[n.tipo]?.variant)">
                        {{ TIPO_META[n.tipo]?.label ?? n.tipo }}
                      </BaseBadge>
                      <p class="text-xs text-gray-400 mt-0.5">{{ TIPO_META[n.tipo]?.desc ?? '' }}</p>
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

    <!-- Prueba de envío -->
    <BaseCard>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Diagnóstico de notificaciones</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Envía un email de prueba a tu cuenta y verifica que la tabla de registro existe en la BD
            </p>
          </div>
          <button
            :disabled="probando"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            @click="probarEnvio"
          >
            {{ probando ? 'Enviando...' : '🔔 Probar notificación' }}
          </button>
        </div>

        <!-- Resultado -->
        <div v-if="resultadoPrueba" class="space-y-2">
          <!-- Banner global -->
          <div
            :class="[
              'px-4 py-3 rounded-lg text-sm font-medium',
              resultadoPrueba.ok
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
            ]"
          >
            {{ resultadoPrueba.ok ? '✅ Todo funciona correctamente. Revisa tu bandeja en Mailtrap.' : '❌ Hay un problema. Revisa los detalles abajo.' }}
          </div>

          <!-- Detalle SMTP -->
          <div class="grid grid-cols-2 gap-2">
            <div :class="['p-3 rounded-lg border text-xs', resultadoPrueba.smtp.ok ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10']">
              <p class="font-medium mb-1">📧 SMTP (Mailtrap)</p>
              <p v-if="resultadoPrueba.smtp.ok" class="text-green-600 dark:text-green-400">
                ✓ Email enviado · ID: <span class="font-mono">{{ resultadoPrueba.smtp.messageId?.slice(-20) }}</span>
              </p>
              <p v-else class="text-red-600 dark:text-red-400 break-all">
                ✗ Error: {{ resultadoPrueba.smtp.error }}
              </p>
            </div>
            <div :class="['p-3 rounded-lg border text-xs', resultadoPrueba.db.tablaExiste ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10']">
              <p class="font-medium mb-1">🗄️ Base de datos</p>
              <p v-if="resultadoPrueba.db.tablaExiste && resultadoPrueba.db.ok" class="text-green-600 dark:text-green-400">
                ✓ Tabla existe · Registro guardado
              </p>
              <p v-else-if="resultadoPrueba.db.tablaExiste" class="text-amber-600 dark:text-amber-400">
                ⚠ Tabla existe pero no se pudo insertar (email falló primero)
              </p>
              <p v-else class="text-red-600 dark:text-red-400 break-all">
                ✗ Tabla no encontrada. Ejecuta: <code class="bg-red-100 dark:bg-red-900/30 px-1 rounded">13_notificaciones.sql</code>
                <br v-if="resultadoPrueba.db.error" />
                <span v-if="resultadoPrueba.db.error">{{ resultadoPrueba.db.error }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
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
