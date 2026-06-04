<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCitas } from '@/presentation/composables/useCitas'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal from '@/presentation/components/ui/BaseModal.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { Cita, CancelarCitaPayload } from '@/shared/types/agenda.types'
import { crearCalificacion } from '@/data/datasources/ReporteDatasource'

const router = useRouter()
const { store, loadMisCitas, cancelarCita } = useCitas()

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
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Cancelación ──────────────────────────────────────────────────────────────
const cancelTarget  = ref<Cita | null>(null)
const cancelMotivo  = ref<CancelarCitaPayload['motivo']>('otro')
const cancelDetalle = ref('')
const aceptaTerminos = ref(false)

const MOTIVOS: { value: CancelarCitaPayload['motivo']; label: string }[] = [
  { value: 'salud',      label: 'Salud de la mascota' },
  { value: 'tiempo',     label: 'Falta de tiempo' },
  { value: 'emergencia', label: 'Emergencia personal' },
  { value: 'otro',       label: 'Otro motivo' },
]

function openCancelar(c: Cita) {
  cancelTarget.value   = c
  cancelMotivo.value   = 'otro'
  cancelDetalle.value  = ''
  aceptaTerminos.value = false
}

function closeCancelar() { cancelTarget.value = null }

const horasHastaCita = computed(() => {
  if (!cancelTarget.value?.fecha_hora_inicio) return Infinity
  return (new Date(cancelTarget.value.fecha_hora_inicio).getTime() - Date.now()) / (1000 * 3600)
})

const puedeEnviar = computed(() =>
  aceptaTerminos.value && horasHastaCita.value >= 24
)

async function confirmarCancelacion() {
  if (!cancelTarget.value || !puedeEnviar.value) return
  const ok = await cancelarCita(cancelTarget.value.id_cita, {
    motivo:          cancelMotivo.value,
    detalle:         cancelDetalle.value || null,
    aceptaPolitica:  true,
  })
  if (ok) closeCancelar()
}

// Citas cancelables: solo pendiente o confirmada
function esCancelable(c: Cita) {
  return ['pendiente', 'confirmada'].includes(c.estado)
}

onMounted(() => loadMisCitas())

// ── Calificación rápida ───────────────────────────────────────────────────────
const calTarget     = ref<Cita | null>(null)
const calPuntuacion = ref(0)
const calComentario = ref('')
const calOk         = ref(false)

function abrirCalificar(c: Cita) {
  calTarget.value     = c
  calPuntuacion.value = 0
  calComentario.value = ''
  calOk.value         = false
}

async function confirmarCal() {
  if (!calTarget.value || !calPuntuacion.value) return
  await crearCalificacion({ id_cita: calTarget.value.id_cita, puntuacion: calPuntuacion.value, comentario: calComentario.value || undefined })
  calOk.value = true
  setTimeout(() => { calTarget.value = null }, 1400)
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis citas</h1>
      <BaseButton @click="router.push({ name: ROUTE_NAMES.CLIENT_NUEVA_CITA })">+ Nueva cita</BaseButton>
    </div>

    <div v-if="store.loading && store.citas.length === 0" class="text-center py-12 text-gray-500">
      Cargando…
    </div>

    <div v-else-if="store.citas.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 mb-4">No tienes citas agendadas.</p>
      <BaseButton @click="router.push({ name: ROUTE_NAMES.CLIENT_NUEVA_CITA })">Agendar ahora</BaseButton>
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
            <p v-if="c.nombre_trabajador" class="text-xs text-gray-500 mt-0.5">
              Groomer: {{ c.nombre_trabajador }}
            </p>
            <p v-if="c.notas" class="text-xs text-gray-500 italic mt-1">{{ c.notas }}</p>
            <p v-if="c.estado === 'cancelada' && c.motivo_cancelacion" class="text-xs text-red-500 mt-1">
              Motivo: {{ c.motivo_cancelacion }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2 flex-shrink-0">
            <BaseButton
              v-if="c.estado === 'completada'"
              variant="secondary" size="sm"
              @click="router.push({ name: ROUTE_NAMES.CLIENT_RESUMEN_CITA, params: { id: c.id_cita } })"
            >
              Ver resumen
            </BaseButton>
            <BaseButton
              v-if="c.estado === 'completada'"
              variant="ghost" size="sm"
              @click="abrirCalificar(c)"
            >
              ★ Calificar
            </BaseButton>
            <BaseButton v-if="esCancelable(c)" variant="danger" size="sm" :disabled="store.loading" @click="openCancelar(c)">
              Cancelar
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- ── Modal de cancelación ────────────────────────────────────────────── -->
    <BaseModal :open="!!cancelTarget" title="Cancelar cita" @close="closeCancelar">
      <div class="space-y-4">
        <!-- Advertencia de tiempo -->
        <div v-if="horasHastaCita < 24 && horasHastaCita !== Infinity"
          class="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm text-red-700 dark:text-red-400">
            No es posible cancelar con menos de 24 horas de anticipación.
            Para emergencias contáctanos directamente.
          </p>
        </div>

        <!-- Resumen de la cita -->
        <div v-if="cancelTarget" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
          <p><span class="text-gray-500">Servicio:</span> <span class="font-medium text-gray-900 dark:text-white">{{ cancelTarget.nombre_servicio }}</span></p>
          <p><span class="text-gray-500">Mascota:</span> <span class="font-medium text-gray-900 dark:text-white">{{ cancelTarget.nombre_mascota }}</span></p>
          <p><span class="text-gray-500">Fecha:</span> <span class="font-medium text-gray-900 dark:text-white">{{ formatFecha(cancelTarget.fecha_hora_inicio) }}</span></p>
        </div>

        <!-- Motivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo de cancelación *</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MOTIVOS"
              :key="m.value"
              type="button"
              :class="[
                'text-sm px-3 py-2 rounded-lg border-2 transition-all text-left',
                cancelMotivo === m.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300',
              ]"
              @click="cancelMotivo = m.value"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- Detalle adicional -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detalle (opcional)
          </label>
          <textarea
            v-model="cancelDetalle"
            rows="2"
            placeholder="Cuéntanos más si lo deseas…"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
          />
        </div>

        <!-- Política de cancelación -->
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input
            v-model="aceptaTerminos"
            type="checkbox"
            class="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Entiendo y acepto la
            <strong class="text-gray-900 dark:text-white">política de cancelación</strong>:
            las cancelaciones deben realizarse con al menos
            <strong class="text-gray-900 dark:text-white">24 horas de anticipación</strong>.
            Cancelaciones tardías pueden generar un cargo.
          </span>
        </label>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 pt-1">
          <BaseButton variant="secondary" @click="closeCancelar">Volver</BaseButton>
          <BaseButton
            variant="danger"
            :disabled="!puedeEnviar || store.loading"
            @click="confirmarCancelacion"
          >
            {{ store.loading ? 'Cancelando…' : 'Confirmar cancelación' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal calificación rápida -->
    <BaseModal :open="!!calTarget" title="Calificar servicio" @close="calTarget = null">
      <div v-if="calTarget" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>{{ calTarget.nombre_servicio }}</strong> · {{ calTarget.nombre_mascota }}
        </p>
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Puntuación *</p>
          <div class="flex gap-2">
            <button
              v-for="i in 5" :key="i"
              :class="['text-3xl transition-transform hover:scale-110', i <= calPuntuacion ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600']"
              @click="calPuntuacion = i"
            >★</button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario (opcional)</label>
          <textarea v-model="calComentario" rows="2" placeholder="¿Cómo fue la experiencia?"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div v-if="calOk" class="text-center text-green-600 dark:text-green-400 font-medium py-1">¡Gracias por calificar! 🐾</div>
        <div v-else class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="calTarget = null">Cancelar</BaseButton>
          <BaseButton :disabled="!calPuntuacion" @click="confirmarCal">Enviar</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
