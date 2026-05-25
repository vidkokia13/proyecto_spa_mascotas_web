<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }  from '@/presentation/stores/auth.store'
import { useAgendaStore } from '@/presentation/stores/agenda.store'
import { useCitasStore } from '@/presentation/stores/citas.store'
import { useInsumosStore } from '@/presentation/stores/insumos.store'
import { useDetalle }    from '@/presentation/composables/useDetalle'
import { useCitas }      from '@/presentation/composables/useCitas'
import { useUiStore }    from '@/presentation/stores/ui.store'
import { agendaDatasource } from '@/data/datasources/AgendaDatasource'
import { ROUTE_NAMES }   from '@/shared/constants/routes'
import BaseCard    from '@/presentation/components/ui/BaseCard.vue'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge   from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal   from '@/presentation/components/ui/BaseModal.vue'
import type { EstadoCita, Slot, MetodoPago, TipoFoto, RegisterInsumosItemPayload } from '@/shared/types/agenda.types'

const route    = useRoute()
const router   = useRouter()
const authStore = useAuthStore()
const citasStore = useCitasStore()
const agendaStore = useAgendaStore()
const insumosStore = useInsumosStore()
const uiStore  = useUiStore()
const { store: detalleStore, loadAll, savePago, deletePago, saveFicha, toggleItem, uploadFoto, deleteFoto, saveInsumos } = useDetalle()
const { reprogramarCita, cambiarEstado, cerrarServicio } = useCitas()

const idCita = computed(() => route.params.id as string)
const rol    = computed(() => authStore.userRole ?? '')
const cita   = computed(() => citasStore.selected)

// ── Role helpers ──────────────────────────────────────────────────────────────
const canManagePagos      = computed(() => ['admin','jefe','recepcion'].includes(rol.value))
const canEditFicha        = computed(() => ['trabajador','admin','jefe'].includes(rol.value))
const canToggleChecklist  = computed(() => ['trabajador','admin','jefe','recepcion'].includes(rol.value))
const canUploadFotos      = computed(() => ['trabajador','admin','jefe','recepcion'].includes(rol.value))
const canDeleteFotos      = computed(() => ['trabajador','admin','jefe'].includes(rol.value))
const canEditInsumos      = computed(() => ['trabajador','admin','jefe'].includes(rol.value))
const canReprogramar      = computed(() => ['admin','jefe','recepcion'].includes(rol.value))

// ── Estado transitions ────────────────────────────────────────────────────────
// trabajador uses cerrarServicio for en_proceso→completada (atomic close with checklist)
const TRANSITIONS: Record<string, Record<string, EstadoCita[]>> = {
  trabajador: { pendiente: ['confirmada','en_proceso','cancelada'], confirmada: ['en_proceso','cancelada'] },
  recepcion:  { pendiente: ['confirmada','cancelada'], confirmada: ['cancelada'] },
  admin:      { pendiente: ['confirmada','cancelada'], confirmada: ['en_proceso','cancelada'], en_proceso: ['completada'] },
  jefe:       { pendiente: ['confirmada','cancelada'], confirmada: ['en_proceso','cancelada'], en_proceso: ['completada'] },
}

const canCerrarServicio = computed(() =>
  ['trabajador','admin','jefe'].includes(rol.value) && cita.value?.estado === 'en_proceso',
)
const allowedTransitions = computed(() =>
  cita.value ? (TRANSITIONS[rol.value]?.[cita.value.estado] ?? []) : [],
)

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', en_proceso: 'En proceso',
  completada: 'Completada', cancelada: 'Cancelada',
}
const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800', confirmada: 'bg-green-100 text-green-800',
  en_proceso: 'bg-blue-100 text-blue-800', completada: 'bg-gray-100 text-gray-700',
  cancelada: 'bg-red-100 text-red-800',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { dateStyle: 'medium' })
}

async function onCambiarEstado(estado: EstadoCita) {
  const ok = await cambiarEstado(idCita.value, estado)
  if (ok) await citasStore.fetchOne(idCita.value)
}

async function onCerrarServicio() {
  if (!confirm('¿Confirmas el cierre del servicio? Se verificará el checklist y se notificará al cliente.')) return
  const ok = await cerrarServicio(idCita.value)
  if (ok) await citasStore.fetchOne(idCita.value)
}

// ── Reprogramar ───────────────────────────────────────────────────────────────
const showReprogramar  = ref(false)
const reprFecha        = ref('')
const reprSlots        = ref<Slot[]>([])
const reprSlotSel      = ref<string | null>(null)
const reprLoadingSlots = ref(false)

watch(reprFecha, async (f) => {
  reprSlots.value = []
  reprSlotSel.value = null
  if (!f || !cita.value) return
  reprLoadingSlots.value = true
  try {
    const res = await agendaDatasource.getSlots({
      fecha:       f,
      idServicio:  cita.value.id_servicio,
      idMascota:   cita.value.id_mascota,
      idTrabajador: cita.value.id_trabajador ?? undefined,
    })
    reprSlots.value = res.slots
  } catch { reprSlots.value = [] }
  finally { reprLoadingSlots.value = false }
})

async function submitReprogramar() {
  if (!reprFecha.value || !reprSlotSel.value) return
  const fechaHoraInicio = `${reprFecha.value}T${reprSlotSel.value}:00`
  const ok = await reprogramarCita(idCita.value, fechaHoraInicio)
  if (ok) {
    showReprogramar.value = false
    await citasStore.fetchOne(idCita.value)
  }
}

// ── Ficha técnica ─────────────────────────────────────────────────────────────
const fichaForm = ref({
  estadoPelaje: '', condicionPiel: '', observaciones: '',
  pesoActual: '', estadoIngreso: '', recomendaciones: '',
})
const fichaEditMode = ref(false)

function initFichaForm() {
  const f = detalleStore.ficha
  fichaForm.value = {
    estadoPelaje:   f?.estado_pelaje  ?? '',
    condicionPiel:  f?.condicion_piel ?? '',
    observaciones:  f?.observaciones  ?? '',
    pesoActual:     f?.peso_actual != null ? String(f.peso_actual) : '',
    estadoIngreso:  f?.estado_ingreso  ?? '',
    recomendaciones: f?.recomendaciones ?? '',
  }
}
async function submitFicha() {
  const ok = await saveFicha({
    idCita:          idCita.value,
    estadoPelaje:    fichaForm.value.estadoPelaje    || null,
    condicionPiel:   fichaForm.value.condicionPiel   || null,
    observaciones:   fichaForm.value.observaciones   || null,
    pesoActual:      fichaForm.value.pesoActual ? parseFloat(fichaForm.value.pesoActual) : null,
    estadoIngreso:   fichaForm.value.estadoIngreso   || null,
    recomendaciones: fichaForm.value.recomendaciones || null,
  })
  if (ok) fichaEditMode.value = false
}

// ── Fotos ──────────────────────────────────────────────────────────────────────
const tipoFotoSel = ref<TipoFoto>('antes')
const TIPO_FOTO_LABEL: Record<TipoFoto, string> = { antes: 'Antes', durante: 'Durante', despues: 'Después' }

function fotosByTipo(tipo: TipoFoto) {
  return detalleStore.fotos.filter(f => f.tipo === tipo)
}

async function onFotoFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await uploadFoto(idCita.value, file, tipoFotoSel.value)
  ;(e.target as HTMLInputElement).value = ''
}

// ── Insumos ────────────────────────────────────────────────────────────────────
const showInsumoForm = ref(false)
const insumoLine = ref<RegisterInsumosItemPayload>({
  idInsumo: '', cantidadRecibida: 0, cantidadUsada: 0, cantidadDevuelta: 0, desperdicio: 0,
})

async function submitInsumo() {
  if (!insumoLine.value.idInsumo) return
  const ok = await saveInsumos({ idCita: idCita.value, insumos: [{ ...insumoLine.value }] })
  if (ok) {
    showInsumoForm.value = false
    insumoLine.value = { idInsumo: '', cantidadRecibida: 0, cantidadUsada: 0, cantidadDevuelta: 0, desperdicio: 0 }
    await detalleStore.fetchCitaInsumos(idCita.value)
  }
}

// ── Pagos ──────────────────────────────────────────────────────────────────────
const showPagoForm   = ref(false)
const pagoForm       = ref({ monto: '', metodo: 'efectivo' as MetodoPago, referencia: '' })
const promoCodigo    = ref('')
const promoVerif     = ref<{ descuento: number; montoFinal: number; nombre: string } | null>(null)
const promoLoading   = ref(false)
const promoError     = ref<string | null>(null)

async function verificarPromo() {
  const monto = parseFloat(pagoForm.value.monto)
  if (!promoCodigo.value || !monto) return
  promoLoading.value = true; promoError.value = null; promoVerif.value = null
  try {
    const { data } = await import('@/infrastructure/api/axios.instance').then(m =>
      m.default.post('/promociones/verificar', { codigo: promoCodigo.value.toUpperCase(), montoBase: monto })
    )
    promoVerif.value = { descuento: data.descuento, montoFinal: data.montoFinal, nombre: data.promocion.nombre }
  } catch (e: any) {
    promoError.value = e?.response?.data?.message ?? 'Código inválido o expirado'
  } finally {
    promoLoading.value = false
  }
}

function clearPromo() {
  promoCodigo.value = ''; promoVerif.value = null; promoError.value = null
}

async function submitPago() {
  if (!pagoForm.value.monto) return
  const ok = await savePago({
    idCita:           idCita.value,
    monto:            parseFloat(pagoForm.value.monto),
    metodo:           pagoForm.value.metodo,
    referencia:       pagoForm.value.referencia || null,
    codigoPromocion:  promoVerif.value ? promoCodigo.value.toUpperCase() : null,
  })
  if (ok) {
    showPagoForm.value = false
    pagoForm.value = { monto: '', metodo: 'efectivo', referencia: '' }
    clearPromo()
  }
}

async function onDeletePago(id: string) {
  if (!confirm('¿Eliminar este pago?')) return
  await deletePago(id)
}

// ── Mount ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    citasStore.fetchOne(idCita.value),
    loadAll(idCita.value),
    insumosStore.fetchAll(),
  ])
  initFichaForm()
  const today = new Date().toISOString().slice(0, 10)
  reprFecha.value = today
})

onUnmounted(() => detalleStore.reset())

watch(() => detalleStore.ficha, () => { if (!fichaEditMode.value) initFichaForm() })

const totalPagado = computed(() => detalleStore.pagos.reduce((s, p) => s + Number(p.monto), 0))
</script>

<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Back -->
    <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
      @click="router.back()">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Volver
    </button>

    <div v-if="citasStore.loading && !cita" class="text-center py-20 text-gray-400">Cargando…</div>

    <template v-else-if="cita">
      <!-- ── Header ── -->
      <BaseCard>
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <BaseBadge :color="ESTADO_COLOR[cita.estado]">{{ ESTADO_LABEL[cita.estado] }}</BaseBadge>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ cita.nombre_servicio }}</h1>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">{{ cita.nombre_mascota }}</span>
              <span class="text-xs ml-1 text-gray-400">({{ cita.tamano }}, {{ cita.temperamento }})</span>
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatFecha(cita.fecha_hora_inicio) }} · {{ cita.duracion_ajustada }} min
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Cliente: {{ cita.nombre_cliente }}
              <span class="ml-2 text-xs">{{ cita.email_cliente }}</span>
            </p>
            <p v-if="cita.nombre_trabajador" class="text-sm text-gray-500">
              Groomer: {{ cita.nombre_trabajador }}
            </p>
            <p v-if="cita.notas" class="text-xs italic text-gray-400 mt-1">{{ cita.notas }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Precio base</p>
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ${{ Number(cita.precio_base).toLocaleString('es-CL') }}
            </p>
            <p v-if="totalPagado > 0" class="text-xs text-green-600 dark:text-green-400 mt-1">
              Pagado: ${{ totalPagado.toLocaleString('es-CL') }}
            </p>
          </div>
        </div>

        <!-- State actions -->
        <div v-if="allowedTransitions.length > 0 || canCerrarServicio || (canReprogramar && ['pendiente','confirmada'].includes(cita.estado))"
          class="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <BaseButton
            v-for="next in allowedTransitions" :key="next"
            size="sm"
            :variant="next === 'cancelada' ? 'danger' : next === 'completada' ? 'secondary' : 'primary'"
            :disabled="citasStore.loading"
            @click="onCambiarEstado(next)"
          >
            → {{ ESTADO_LABEL[next] }}
          </BaseButton>
          <BaseButton v-if="canCerrarServicio"
            size="sm" variant="primary"
            :disabled="citasStore.loading"
            @click="onCerrarServicio">
            ✓ Cerrar servicio
          </BaseButton>
          <BaseButton v-if="canReprogramar && ['pendiente','confirmada'].includes(cita.estado)"
            size="sm" variant="secondary"
            @click="showReprogramar = true">
            Reprogramar
          </BaseButton>
        </div>
      </BaseCard>

      <!-- ── Ficha Técnica ── -->
      <BaseCard>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-900 dark:text-white">Ficha técnica</h2>
          <BaseButton v-if="canEditFicha && !fichaEditMode" size="sm" variant="secondary"
            @click="fichaEditMode = true">
            {{ detalleStore.ficha ? 'Editar' : 'Completar' }}
          </BaseButton>
        </div>

        <div v-if="!fichaEditMode && detalleStore.ficha">
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt class="text-gray-500">Estado del pelaje</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ detalleStore.ficha.estado_pelaje ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Condición de piel</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ detalleStore.ficha.condicion_piel ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Peso actual (kg)</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ detalleStore.ficha.peso_actual ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Actualizada</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatDate(detalleStore.ficha.actualizado_en) }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-gray-500">Observaciones</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ detalleStore.ficha.observaciones ?? '—' }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-gray-500">Estado al ingreso</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ detalleStore.ficha.estado_ingreso ?? '—' }}</dd>
            </div>
            <div v-if="detalleStore.ficha.recomendaciones" class="col-span-2">
              <dt class="text-gray-500 mb-1">Recomendaciones del groomer</dt>
              <dd class="font-medium text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 px-3 py-2 rounded text-sm">
                {{ detalleStore.ficha.recomendaciones }}
              </dd>
            </div>
          </dl>
        </div>

        <p v-else-if="!fichaEditMode && !detalleStore.ficha" class="text-sm text-gray-400 italic">
          Sin ficha técnica registrada.
        </p>

        <div v-if="fichaEditMode" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Estado del pelaje</label>
              <input v-model="fichaForm.estadoPelaje" type="text" placeholder="Ej: limpio, enredado…"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Condición de piel</label>
              <input v-model="fichaForm.condicionPiel" type="text" placeholder="Ej: normal, irritada…"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Peso actual (kg)</label>
              <input v-model="fichaForm.pesoActual" type="number" step="0.1" min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Observaciones</label>
            <textarea v-model="fichaForm.observaciones" rows="2" placeholder="Observaciones generales…"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Estado al ingreso</label>
            <textarea v-model="fichaForm.estadoIngreso" rows="2" placeholder="Descripción del estado de la mascota al ingresar…"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Recomendaciones para el cliente</label>
            <textarea v-model="fichaForm.recomendaciones" rows="3" placeholder="Cuidados post-servicio, próxima visita recomendada…"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
            <p class="text-xs text-gray-400 mt-1">Se incluirán en el email de notificación al cerrar el servicio.</p>
          </div>
          <div class="flex gap-2">
            <BaseButton size="sm" :disabled="detalleStore.loading" @click="submitFicha">Guardar ficha</BaseButton>
            <BaseButton size="sm" variant="secondary" @click="fichaEditMode = false; initFichaForm()">Cancelar</BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- ── Checklist ── -->
      <BaseCard>
        <h2 class="font-semibold text-gray-900 dark:text-white mb-3">Checklist de servicio</h2>
        <div v-if="detalleStore.loading && detalleStore.checklist.length === 0"
          class="text-sm text-gray-400">Cargando…</div>
        <div v-else-if="detalleStore.checklist.length === 0" class="text-sm text-gray-400 italic">
          Sin ítems de checklist.
        </div>
        <ul v-else class="space-y-2">
          <li v-for="item in detalleStore.checklist" :key="item.id_item"
            class="flex items-center gap-3">
            <input type="checkbox"
              :checked="item.completado"
              :disabled="!canToggleChecklist"
              class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
              @change="toggleItem(idCita, item.id_item, !item.completado)"
            />
            <span :class="['text-sm', item.completado ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300']">
              {{ item.descripcion }}
            </span>
            <span v-if="item.completado_en" class="text-xs text-gray-400 ml-auto">
              {{ formatDate(item.completado_en) }}
            </span>
          </li>
        </ul>
        <p class="text-xs text-gray-400 mt-2">
          {{ detalleStore.checklist.filter(i => i.completado).length }} /
          {{ detalleStore.checklist.length }} completados
        </p>
      </BaseCard>

      <!-- ── Fotos ── -->
      <BaseCard>
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 class="font-semibold text-gray-900 dark:text-white">Fotos</h2>
          <div v-if="canUploadFotos" class="flex items-center gap-2">
            <select v-model="tipoFotoSel"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option v-for="t in (['antes','durante','despues'] as TipoFoto[])" :key="t" :value="t">
                {{ TIPO_FOTO_LABEL[t] }}
              </option>
            </select>
            <label class="cursor-pointer">
              <span class="inline-flex items-center gap-1 rounded-lg bg-primary-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-700 transition">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Subir
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"
                :disabled="detalleStore.loading" @change="onFotoFile" />
            </label>
          </div>
        </div>

        <div v-for="tipo in (['antes','durante','despues'] as TipoFoto[])" :key="tipo">
          <div v-if="fotosByTipo(tipo).length > 0" class="mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{{ TIPO_FOTO_LABEL[tipo] }}</p>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <div v-for="f in fotosByTipo(tipo)" :key="f.id_foto" class="relative group">
                <img :src="f.url" :alt="tipo"
                  class="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                <button v-if="canDeleteFotos"
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  @click="deleteFoto(f.id_foto)">✕</button>
              </div>
            </div>
          </div>
        </div>
        <p v-if="detalleStore.fotos.length === 0" class="text-sm text-gray-400 italic">Sin fotos cargadas.</p>
      </BaseCard>

      <!-- ── Insumos ── -->
      <BaseCard>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-900 dark:text-white">Insumos utilizados</h2>
          <BaseButton v-if="canEditInsumos" size="sm" variant="secondary"
            @click="showInsumoForm = !showInsumoForm">
            {{ showInsumoForm ? 'Cancelar' : '+ Agregar' }}
          </BaseButton>
        </div>

        <div v-if="showInsumoForm" class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Insumo</label>
              <select v-model="insumoLine.idInsumo"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="">Seleccionar…</option>
                <option v-for="ins in insumosStore.insumos.filter(i => i.activo)"
                  :key="ins.id_insumo" :value="ins.id_insumo">
                  {{ ins.nombre }} (stock: {{ ins.stock }} {{ ins.unidad }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Cant. recibida</label>
              <input v-model.number="insumoLine.cantidadRecibida" type="number" min="0" step="0.1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Cant. usada</label>
              <input v-model.number="insumoLine.cantidadUsada" type="number" min="0" step="0.1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Devuelta</label>
              <input v-model.number="insumoLine.cantidadDevuelta" type="number" min="0" step="0.1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Desperdicio</label>
              <input v-model.number="insumoLine.desperdicio" type="number" min="0" step="0.1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>
          <BaseButton size="sm" :disabled="!insumoLine.idInsumo || detalleStore.loading" @click="submitInsumo">
            Registrar insumo
          </BaseButton>
        </div>

        <div v-if="detalleStore.citaInsumos.length === 0 && !showInsumoForm"
          class="text-sm text-gray-400 italic">Sin insumos registrados.</div>
        <div v-else-if="detalleStore.citaInsumos.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th class="pb-2 pr-4">Insumo</th>
                <th class="pb-2 pr-4">Recibido</th>
                <th class="pb-2 pr-4">Usado</th>
                <th class="pb-2 pr-4">Devuelto</th>
                <th class="pb-2">Desperdicio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ci in detalleStore.citaInsumos" :key="ci.id_cita_insumo"
                class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                  {{ ci.nombre_insumo }}
                  <span class="text-xs text-gray-400">({{ ci.unidad }})</span>
                </td>
                <td class="py-2 pr-4 text-gray-600 dark:text-gray-400">{{ ci.cantidad_recibida }}</td>
                <td class="py-2 pr-4 text-gray-600 dark:text-gray-400">{{ ci.cantidad_usada }}</td>
                <td class="py-2 pr-4 text-gray-600 dark:text-gray-400">{{ ci.cantidad_devuelta }}</td>
                <td class="py-2 text-gray-600 dark:text-gray-400">{{ ci.desperdicio }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- ── Pagos ── -->
      <BaseCard v-if="canManagePagos">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-900 dark:text-white">Pagos</h2>
          <BaseButton size="sm" variant="secondary" @click="showPagoForm = !showPagoForm">
            {{ showPagoForm ? 'Cancelar' : '+ Registrar pago' }}
          </BaseButton>
        </div>

        <div v-if="showPagoForm" class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Monto ($)</label>
              <input v-model="pagoForm.monto" type="number" min="1" step="0.01" placeholder="0.00"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                @change="clearPromo" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Método</label>
              <select v-model="pagoForm.metodo"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Referencia (opcional)</label>
              <input v-model="pagoForm.referencia" type="text" placeholder="N° transferencia, comprobante…"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <!-- Promoción -->
            <div class="col-span-2">
              <label class="block text-xs text-gray-500 mb-1">Código de promoción (opcional)</label>
              <div class="flex gap-2">
                <input v-model="promoCodigo" type="text" maxlength="30" placeholder="Ej: VERANO2025"
                  class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase"
                  @input="promoCodigo = promoCodigo.toUpperCase(); promoVerif = null; promoError = null" />
                <BaseButton size="sm" variant="secondary"
                  :disabled="!promoCodigo || !pagoForm.monto || promoLoading"
                  @click="verificarPromo">
                  {{ promoLoading ? '…' : 'Verificar' }}
                </BaseButton>
              </div>
              <!-- Resultado verificación -->
              <div v-if="promoVerif"
                class="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
                <p class="font-semibold text-green-700 dark:text-green-400">{{ promoVerif.nombre }}</p>
                <p class="text-green-600 dark:text-green-400">
                  Descuento: -${{ Number(promoVerif.descuento).toLocaleString('es-CL') }} →
                  Total: ${{ Number(promoVerif.montoFinal).toLocaleString('es-CL') }}
                </p>
              </div>
              <p v-if="promoError" class="mt-1 text-xs text-red-500">{{ promoError }}</p>
            </div>
          </div>
          <BaseButton size="sm" :disabled="!pagoForm.monto || detalleStore.loading" @click="submitPago">
            Registrar pago
          </BaseButton>
        </div>

        <div v-if="detalleStore.pagos.length === 0 && !showPagoForm"
          class="text-sm text-gray-400 italic">Sin pagos registrados.</div>
        <div v-else class="space-y-2">
          <div v-for="p in detalleStore.pagos" :key="p.id_pago"
            class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">
                ${{ Number(p.monto).toLocaleString('es-CL') }}
                <span class="ml-2 text-xs font-normal text-gray-500 capitalize">{{ p.metodo }}</span>
              </p>
              <p v-if="p.referencia" class="text-xs text-gray-400">Ref: {{ p.referencia }}</p>
            </div>
            <button v-if="['admin','jefe'].includes(rol)"
              class="text-red-500 hover:text-red-700 text-xs" @click="onDeletePago(p.id_pago)">
              Eliminar
            </button>
          </div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
            Total: ${{ totalPagado.toLocaleString('es-CL') }}
          </p>
        </div>
      </BaseCard>
    </template>

    <!-- ── Reprogramar Modal ── -->
    <BaseModal :show="showReprogramar" title="Reprogramar cita" @close="showReprogramar = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nueva fecha</label>
          <input v-model="reprFecha" type="date" :min="new Date().toISOString().slice(0,10)"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <div v-if="reprLoadingSlots" class="text-sm text-gray-400 text-center py-4">Buscando slots…</div>
        <div v-else-if="reprSlots.length === 0 && reprFecha" class="text-sm text-gray-400 text-center py-4">
          No hay slots disponibles para esa fecha.
        </div>
        <div v-else-if="reprSlots.length > 0">
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">Selecciona horario</label>
          <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            <button
              v-for="s in reprSlots" :key="s.hora"
              :class="[
                'py-2 rounded-lg text-sm font-medium border transition',
                reprSlotSel === s.hora
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400',
              ]"
              @click="reprSlotSel = s.hora"
            >
              {{ s.hora }}
            </button>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <BaseButton variant="secondary" size="sm" @click="showReprogramar = false">Cancelar</BaseButton>
          <BaseButton size="sm"
            :disabled="!reprSlotSel || citasStore.loading"
            @click="submitReprogramar">
            Confirmar reprogramación
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
