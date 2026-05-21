<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServicios } from '@/presentation/composables/useServicios'
import { useMascotas } from '@/presentation/composables/useMascotas'
import { useAgenda } from '@/presentation/composables/useAgenda'
import { useCitas } from '@/presentation/composables/useCitas'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { Servicio, Mascota, Slot } from '@/shared/types/agenda.types'

const router = useRouter()

const { store: serviciosStore, loadAll: loadServicios }  = useServicios()
const { store: mascotasStore,  loadAll: loadMascotas }   = useMascotas()
const { store: agendaStore,    loadSlots }                = useAgenda()
const { createCita, store: citasStore }                   = useCitas()

// ── Step state ──────────────────────────────────────────────────────────────
const step = ref<1 | 2 | 3>(1)

// Step 1 — service & pet
const selectedServicio = ref<Servicio | null>(null)
const selectedMascota  = ref<Mascota | null>(null)

// Step 2 — date & slot
const selectedFecha = ref<string>('')
const selectedSlot  = ref<Slot | null>(null)

// Step 3 — confirm
const notas = ref<string>('')
const submitting = ref(false)

// ── Helpers ──────────────────────────────────────────────────────────────────
const today = computed(() => new Date().toISOString().slice(0, 10))

const TAMANO_LABEL: Record<string, string> = {
  pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande', gigante: 'Gigante',
}
const TEMP_LABEL: Record<string, string> = {
  tranquilo: 'Tranquilo', nervioso: 'Nervioso', agresivo: 'Agresivo',
}

function fmtTime(hhmm: string): string {
  return hhmm.slice(0, 5)
}

function fmtFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function selectServicio(s: Servicio) {
  selectedServicio.value = s
}

function selectMascota(m: Mascota) {
  selectedMascota.value = m
}

const canGoStep2 = computed(() => !!selectedServicio.value && !!selectedMascota.value)

function goStep2() {
  if (!canGoStep2.value) return
  step.value = 2
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
const loadingSlots = computed(() => agendaStore.loading)

watch(selectedFecha, async (fecha) => {
  if (!fecha || !selectedServicio.value || !selectedMascota.value) return
  selectedSlot.value = null
  agendaStore.clearSlots()
  await loadSlots({
    fecha,
    idServicio: selectedServicio.value.id_servicio,
    idMascota:  selectedMascota.value.id_mascota,
  })
})

function selectSlot(s: Slot) {
  selectedSlot.value = s
}

const canGoStep3 = computed(() => !!selectedFecha.value && !!selectedSlot.value)

function goStep3() {
  if (!canGoStep3.value) return
  step.value = 3
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
const resumenFecha = computed(() => {
  if (!selectedFecha.value || !selectedSlot.value) return ''
  return `${fmtFecha(selectedFecha.value)} a las ${fmtTime(selectedSlot.value.hora)}`
})

async function confirmar() {
  if (!selectedServicio.value || !selectedMascota.value || !selectedSlot.value || !selectedFecha.value) return
  submitting.value = true
  const fechaHoraInicio = `${selectedFecha.value}T${selectedSlot.value.hora}:00`
  const ok = await createCita({
    idMascota:       selectedMascota.value.id_mascota,
    idServicio:      selectedServicio.value.id_servicio,
    fechaHoraInicio,
    notas: notas.value || null,
  })
  submitting.value = false
  if (ok) router.push({ name: ROUTE_NAMES.CLIENT_CITAS })
}

onMounted(async () => {
  await Promise.all([loadServicios(), loadMascotas()])
})
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button class="text-gray-400 hover:text-gray-600 transition" @click="router.push({ name: ROUTE_NAMES.CLIENT_CITAS })">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nueva cita</h1>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-8">
      <div v-for="n in 3" :key="n" class="flex items-center gap-2">
        <div :class="[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
          step > n ? 'bg-green-500 text-white' : step === n ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        ]">
          <svg v-if="step > n" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ n }}</span>
        </div>
        <span :class="['text-sm font-medium', step === n ? 'text-gray-900 dark:text-white' : 'text-gray-400']">
          {{ n === 1 ? 'Servicio & Mascota' : n === 2 ? 'Fecha & Hora' : 'Confirmar' }}
        </span>
        <div v-if="n < 3" class="h-px w-8 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      </div>
    </div>

    <!-- ── STEP 1 ─────────────────────────────────────────────────────────── -->
    <div v-if="step === 1" class="space-y-6">
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">¿Qué servicio necesitas?</h2>
        <div v-if="serviciosStore.loading" class="text-center py-6 text-gray-400">Cargando servicios…</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="s in serviciosStore.servicios"
            :key="s.id_servicio"
            :class="[
              'text-left p-4 rounded-xl border-2 transition-all',
              selectedServicio?.id_servicio === s.id_servicio
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300',
            ]"
            @click="selectServicio(s)"
          >
            <p class="font-semibold text-gray-900 dark:text-white">{{ s.nombre }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ s.duracion_base }} min · S/ {{ s.precio_base }}</p>
            <p v-if="s.descripcion" class="text-xs text-gray-400 mt-1">{{ s.descripcion }}</p>
          </button>
        </div>
      </div>

      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">¿Para qué mascota?</h2>
        <div v-if="mascotasStore.loading" class="text-center py-6 text-gray-400">Cargando mascotas…</div>
        <div v-else-if="mascotasStore.mascotas.length === 0" class="text-center py-6">
          <p class="text-gray-500 mb-3">No tienes mascotas registradas.</p>
          <BaseButton size="sm" @click="router.push({ name: ROUTE_NAMES.CLIENT_MASCOTAS })">Registrar mascota</BaseButton>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="m in mascotasStore.mascotas"
            :key="m.id_mascota"
            :class="[
              'text-left p-4 rounded-xl border-2 transition-all',
              selectedMascota?.id_mascota === m.id_mascota
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300',
            ]"
            @click="selectMascota(m)"
          >
            <p class="font-semibold text-gray-900 dark:text-white capitalize">{{ m.nombre }}</p>
            <p class="text-xs text-gray-500">{{ m.especie }}<span v-if="m.raza"> · {{ m.raza }}</span></p>
            <p class="text-xs text-gray-400">{{ TAMANO_LABEL[m.tamano] }} · {{ TEMP_LABEL[m.temperamento] }}</p>
          </button>
        </div>
      </div>

      <div class="flex justify-end">
        <BaseButton :disabled="!canGoStep2" @click="goStep2">Continuar →</BaseButton>
      </div>
    </div>

    <!-- ── STEP 2 ─────────────────────────────────────────────────────────── -->
    <div v-else-if="step === 2" class="space-y-6">
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Selecciona la fecha</h2>
        <input
          v-model="selectedFecha"
          type="date"
          :min="today"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
      </div>

      <div v-if="selectedFecha">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Horarios disponibles
          <span v-if="agendaStore.slotsInfo" class="text-sm font-normal text-gray-500">
            · {{ agendaStore.slotsInfo.duracion_ajustada }} min
          </span>
        </h2>

        <div v-if="loadingSlots" class="text-center py-6 text-gray-400">Buscando slots…</div>
        <div v-else-if="agendaStore.slots.length === 0 && !loadingSlots" class="text-center py-6">
          <p class="text-gray-500">No hay horarios disponibles para este día.</p>
          <p class="text-xs text-gray-400 mt-1">Prueba con otra fecha.</p>
        </div>
        <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <button
            v-for="slot in agendaStore.slots"
            :key="slot.hora"
            :class="[
              'py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
              selectedSlot?.hora === slot.hora
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300',
            ]"
            @click="selectSlot(slot)"
          >
            {{ fmtTime(slot.hora) }}
          </button>
        </div>
      </div>

      <div class="flex justify-between">
        <BaseButton variant="secondary" @click="step = 1">← Atrás</BaseButton>
        <BaseButton :disabled="!canGoStep3" @click="goStep3">Continuar →</BaseButton>
      </div>
    </div>

    <!-- ── STEP 3 ─────────────────────────────────────────────────────────── -->
    <div v-else class="space-y-6">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Confirma tu cita</h2>

      <BaseCard>
        <dl class="space-y-3">
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500">Servicio</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ selectedServicio?.nombre }}</dd>
          </div>
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500">Mascota</dt>
            <dd class="font-medium text-gray-900 dark:text-white capitalize">{{ selectedMascota?.nombre }}</dd>
          </div>
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500">Fecha y hora</dt>
            <dd class="font-medium text-gray-900 dark:text-white capitalize">{{ resumenFecha }}</dd>
          </div>
          <div v-if="agendaStore.slotsInfo" class="flex justify-between text-sm">
            <dt class="text-gray-500">Duración estimada</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ agendaStore.slotsInfo.duracion_ajustada }} min</dd>
          </div>
          <div class="flex justify-between text-sm">
            <dt class="text-gray-500">Precio base</dt>
            <dd class="font-semibold text-gray-900 dark:text-white">S/ {{ selectedServicio?.precio_base }}</dd>
          </div>
        </dl>
      </BaseCard>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas adicionales (opcional)</label>
        <textarea v-model="notas" rows="3" placeholder="Alergias, instrucciones especiales…"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
      </div>

      <div class="flex justify-between">
        <BaseButton variant="secondary" @click="step = 2">← Atrás</BaseButton>
        <BaseButton :loading="submitting" :disabled="submitting" @click="confirmar">
          Confirmar cita
        </BaseButton>
      </div>
    </div>
  </div>
</template>
