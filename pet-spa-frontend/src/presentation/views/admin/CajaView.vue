<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCaja } from '@/presentation/composables/useCaja'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import { pagoDatasource } from '@/data/datasources/PagoDatasource'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'

const { store, loadResumen, cerrarCaja, reabrirCaja, loadHistorial } = useCaja()
const authStore = useAuthStore()
const uiStore   = useUiStore()
const rol = computed(() => authStore.userRole)

const fechaSel   = ref(new Date().toISOString().slice(0, 10))
const notas      = ref('')
const showCierre = ref(false)
const tab        = ref<'resumen' | 'historial'>('resumen')

const resumen  = computed(() => store.resumen)
const historial = computed(() => store.historial)

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia',
}
const METODO_COLOR: Record<string, string> = {
  efectivo: 'bg-green-100 text-green-800',
  qr: 'bg-blue-100 text-blue-800',
  transferencia: 'bg-purple-100 text-purple-800',
}

function formatMonto(n: number | string) {
  return `$${Number(n).toLocaleString('es-CL')}`
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

async function onCerrar() {
  const ok = await cerrarCaja({ fecha: fechaSel.value, notas: notas.value || undefined })
  if (ok) {
    showCierre.value = false
    notas.value = ''
    await loadResumen(fechaSel.value)
  }
}

async function onReabrir() {
  if (!confirm('¿Seguro que deseas reabrir la caja? Se eliminará el registro de cierre.')) return
  const ok = await reabrirCaja(fechaSel.value)
  if (ok) await loadResumen(fechaSel.value)
}

async function onDeletePago(idPago: string) {
  if (!confirm('¿Eliminar este pago?')) return
  try {
    await pagoDatasource.remove(idPago)
    await loadResumen(fechaSel.value)
  } catch {
    // error toast handled by axios interceptor
  }
}

function onSolicitarDeletePago() {
  uiStore.showToast('Para eliminar un pago, solicítalo a un jefe o administrador.', 'info')
}

async function onChangeFecha() {
  await loadResumen(fechaSel.value)
}

async function onChangeTab(t: typeof tab.value) {
  tab.value = t
  if (t === 'historial' && historial.value.length === 0) await loadHistorial()
}

onMounted(async () => {
  await loadResumen(fechaSel.value)
})
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Caja</h1>
      <div class="flex items-center gap-2">
        <button
          :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition', tab === 'resumen' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700']"
          @click="onChangeTab('resumen')">
          Resumen
        </button>
        <button
          :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition', tab === 'historial' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700']"
          @click="onChangeTab('historial')">
          Historial
        </button>
      </div>
    </div>

    <!-- ── Resumen Tab ── -->
    <template v-if="tab === 'resumen'">
      <div class="flex items-center gap-3 mb-5 flex-wrap">
        <input v-model="fechaSel" type="date" :max="new Date().toISOString().slice(0,10)"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          @change="onChangeFecha" />
        <span class="text-sm text-gray-500">{{ store.loading ? 'Cargando…' : '' }}</span>
      </div>

      <div v-if="!resumen && !store.loading" class="text-center py-10 text-gray-400">
        No hay datos para esta fecha.
      </div>

      <template v-else-if="resumen">
        <!-- Totales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <BaseCard class="text-center">
            <p class="text-xs text-gray-500 mb-1">Total del día</p>
            <p class="text-xl font-bold text-primary-600 dark:text-primary-400">{{ formatMonto(resumen.total_general) }}</p>
          </BaseCard>
          <BaseCard class="text-center">
            <p class="text-xs text-gray-500 mb-1">Descuentos</p>
            <p class="text-xl font-bold text-orange-500">{{ formatMonto(resumen.total_descuentos) }}</p>
          </BaseCard>
          <BaseCard class="text-center">
            <p class="text-xs text-gray-500 mb-1">Pagos</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ resumen.num_pagos }}</p>
          </BaseCard>
          <BaseCard class="text-center">
            <p class="text-xs text-gray-500 mb-1">Citas</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ resumen.num_citas }}</p>
          </BaseCard>
        </div>

        <!-- Por método -->
        <BaseCard class="mb-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-3">Por método de pago</h2>
          <div v-if="resumen.por_metodo.length === 0" class="text-sm text-gray-400 italic">Sin pagos registrados.</div>
          <div v-else class="space-y-2">
            <div v-for="m in resumen.por_metodo" :key="m.metodo"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div class="flex items-center gap-2">
                <BaseBadge :color="METODO_COLOR[m.metodo] ?? 'bg-gray-100 text-gray-700'">
                  {{ METODO_LABEL[m.metodo] ?? m.metodo }}
                </BaseBadge>
                <span class="text-sm text-gray-500">{{ m.cantidad }} pago{{ m.cantidad !== 1 ? 's' : '' }}</span>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">{{ formatMonto(m.total) }}</p>
                <p v-if="Number(m.total_descuentos) > 0" class="text-xs text-orange-500">
                  -{{ formatMonto(m.total_descuentos) }} desc.
                </p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Listado de pagos -->
        <BaseCard class="mb-5">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-3">Detalle de pagos</h2>
          <div v-if="resumen.pagos.length === 0" class="text-sm text-gray-400 italic">Sin pagos.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th class="pb-2 pr-3">Cliente</th>
                  <th class="pb-2 pr-3">Mascota / Servicio</th>
                  <th class="pb-2 pr-3">Método</th>
                  <th class="pb-2 pr-3 text-right">Monto</th>
                  <th class="pb-2 text-right">Descuento</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in resumen.pagos" :key="p.id_pago"
                  class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td class="py-2 pr-3 font-medium text-gray-900 dark:text-white">{{ p.nombre_cliente }}</td>
                  <td class="py-2 pr-3 text-gray-500">
                    {{ p.nombre_mascota }}<br/>
                    <span class="text-xs">{{ p.nombre_servicio }}</span>
                  </td>
                  <td class="py-2 pr-3">
                    <BaseBadge :color="METODO_COLOR[p.metodo] ?? 'bg-gray-100 text-gray-700'">
                      {{ METODO_LABEL[p.metodo] ?? p.metodo }}
                    </BaseBadge>
                  </td>
                  <td class="py-2 pr-3 text-right font-semibold text-gray-900 dark:text-white">
                    {{ formatMonto(p.monto) }}
                  </td>
                  <td class="py-2 text-right text-orange-500">
                    {{ Number(p.descuento) > 0 ? `-${formatMonto(p.descuento)}` : '—' }}
                  </td>
                  <td class="py-2 pl-3 text-right">
                    <button v-if="['admin','jefe'].includes(rol ?? '')"
                      class="text-red-500 hover:text-red-700 text-xs" @click="onDeletePago(p.id_pago)">
                      Eliminar
                    </button>
                    <button v-else-if="rol === 'recepcion'"
                      class="text-yellow-500 hover:text-yellow-700 text-xs" @click="onSolicitarDeletePago()">
                      Solicitar eliminación
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- Estado del cierre -->
        <BaseCard>
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Estado del cierre</h2>
              <p v-if="resumen.ya_cerrada" class="text-sm text-green-600 dark:text-green-400 mt-1">
                Caja cerrada el {{ formatFecha(resumen.cierre?.cerrado_en ?? '') }}
              </p>
              <p v-else class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                La caja de este día aún no está cerrada.
              </p>
            </div>
            <div class="flex gap-2">
              <BaseButton v-if="!resumen.ya_cerrada && ['admin','jefe'].includes(rol ?? '')" size="sm" @click="showCierre = true">
                Cerrar caja
              </BaseButton>
              <BaseButton v-if="resumen.ya_cerrada && rol === 'jefe'" size="sm" variant="secondary"
                :disabled="store.loading" @click="onReabrir">
                Reabrir caja
              </BaseButton>
            </div>
          </div>

          <div v-if="showCierre && ['admin','jefe'].includes(rol ?? '')" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
              <textarea v-model="notas" rows="2" placeholder="Observaciones del cierre…"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
            </div>
            <div class="flex gap-2">
              <BaseButton size="sm" :disabled="store.loading" @click="onCerrar">Confirmar cierre</BaseButton>
              <BaseButton size="sm" variant="secondary" @click="showCierre = false">Cancelar</BaseButton>
            </div>
          </div>

          <div v-if="resumen.ya_cerrada && resumen.cierre" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <dt class="text-xs text-gray-500">Efectivo</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ formatMonto(resumen.cierre.total_efectivo) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">QR</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ formatMonto(resumen.cierre.total_qr) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Transferencia</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ formatMonto(resumen.cierre.total_transferencia) }}</dd>
              </div>
              <div v-if="resumen.cierre.notas" class="col-span-full">
                <dt class="text-xs text-gray-500">Notas</dt>
                <dd class="text-gray-700 dark:text-gray-300">{{ resumen.cierre.notas }}</dd>
              </div>
            </dl>
          </div>
        </BaseCard>
      </template>
    </template>

    <!-- ── Historial Tab ── -->
    <template v-else>
      <div v-if="store.loading && historial.length === 0" class="text-center py-12 text-gray-400">Cargando…</div>
      <div v-else-if="historial.length === 0" class="text-center py-10 text-gray-400">Sin cierres registrados.</div>
      <div v-else class="space-y-3">
        <BaseCard v-for="c in historial" :key="c.id_cierre">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ c.fecha }}</p>
              <p class="text-sm text-gray-500">Cerrado el {{ formatFecha(c.cerrado_en) }}</p>
              <p v-if="c.notas" class="text-xs text-gray-400 mt-1 italic">{{ c.notas }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatMonto(c.total_general) }}</p>
              <p v-if="Number(c.total_descuentos) > 0" class="text-xs text-orange-500">
                -{{ formatMonto(c.total_descuentos) }} descuentos
              </p>
              <p class="text-xs text-gray-400">{{ c.num_pagos }} pagos · {{ c.num_citas }} citas</p>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p class="text-xs text-gray-500">Efectivo</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatMonto(c.total_efectivo) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">QR</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatMonto(c.total_qr) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Transferencia</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatMonto(c.total_transferencia) }}</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
