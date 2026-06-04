<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import * as ds from '@/data/datasources/ReporteDatasource'
import type { HistorialCita } from '@/shared/types/agenda.types'

const loading  = ref(false)
const historial = ref<HistorialCita[]>([])
const error    = ref<string | null>(null)

// Filtro por mascota
const mascotaFiltro = ref<string>('')
const mascotas = computed(() => {
  const seen = new Set<string>()
  const list: { id: string; nombre: string }[] = []
  for (const h of historial.value) {
    if (!seen.has(h.id_mascota)) {
      seen.add(h.id_mascota)
      list.push({ id: h.id_mascota, nombre: h.mascota })
    }
  }
  return list
})
const historialFiltrado = computed(() =>
  mascotaFiltro.value
    ? historial.value.filter(h => h.id_mascota === mascotaFiltro.value)
    : historial.value,
)

// Expandir cita
const expandida = ref<string | null>(null)
function toggleExpand(id: string) {
  expandida.value = expandida.value === id ? null : id
}

// Vista previa de foto
const fotoActiva = ref<string | null>(null)

// ── Calificación ─────────────────────────────────────────────────────────────
const citaACalificar = ref<HistorialCita | null>(null)
const puntuacion     = ref(0)
const comentario     = ref('')
const calificandoOk  = ref(false)
const calificandoErr = ref('')

function abrirCalificar(h: HistorialCita) {
  citaACalificar.value = h
  puntuacion.value     = h.puntuacion ?? 0
  comentario.value     = h.comentario_calificacion ?? ''
  calificandoOk.value  = false
  calificandoErr.value = ''
}

async function confirmarCalificacion() {
  if (!citaACalificar.value || !puntuacion.value) return
  calificandoErr.value = ''
  try {
    await ds.crearCalificacion({
      id_cita:    citaACalificar.value.id_cita,
      puntuacion: puntuacion.value,
      comentario: comentario.value || undefined,
    })
    // Actualizar localmente
    const h = historial.value.find(x => x.id_cita === citaACalificar.value!.id_cita)
    if (h) { h.puntuacion = puntuacion.value; h.comentario_calificacion = comentario.value }
    calificandoOk.value = true
    setTimeout(() => { citaACalificar.value = null }, 1200)
  } catch (e: any) {
    calificandoErr.value = e.message
  }
}

// ── Carga ─────────────────────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  error.value   = null
  try {
    const res = await ds.fetchHistorialClinico()
    historial.value = res.historial
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
}
const TIPO_FOTO: Record<string, string> = { antes: 'Antes', durante: 'Durante', despues: 'Después' }
const TIPO_COLOR: Record<string, string> = {
  antes:   'bg-amber-100 text-amber-700',
  durante: 'bg-blue-100 text-blue-700',
  despues: 'bg-green-100 text-green-700',
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <!-- Cabecera -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Historial clínico</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fichas, recomendaciones y fotos de cada servicio</p>
    </div>

    <!-- Filtro mascotas -->
    <div v-if="mascotas.length > 1" class="flex flex-wrap gap-2">
      <button
        v-for="m in [{ id: '', nombre: 'Todas' }, ...mascotas]"
        :key="m.id"
        :class="[
          'px-4 py-1.5 rounded-full text-sm font-medium transition',
          mascotaFiltro === m.id
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
        ]"
        @click="mascotaFiltro = m.id"
      >{{ m.nombre }}</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Cargando historial...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <div v-else-if="!historialFiltrado.length" class="text-center py-16 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>Sin historial clínico aún</p>
    </div>

    <!-- Lista de citas completadas -->
    <div v-else class="space-y-4">
      <BaseCard v-for="h in historialFiltrado" :key="h.id_cita">
        <!-- Encabezado de la cita -->
        <button class="w-full text-left" @click="toggleExpand(h.id_cita)">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <!-- Foto mascota o avatar -->
              <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex-shrink-0 overflow-hidden">
                <img v-if="h.foto_mascota" :src="h.foto_mascota" :alt="h.mascota" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  {{ h.mascota.charAt(0) }}
                </div>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900 dark:text-white">{{ h.mascota }}</span>
                  <span class="text-xs text-gray-400 capitalize">{{ h.tamano }}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ h.servicio }} · {{ fmtFecha(h.fecha_cita) }}</p>
                <p class="text-xs text-gray-400">Groomer: {{ h.groomer }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <!-- Calificación existente -->
              <div v-if="h.puntuacion" class="flex items-center gap-1">
                <span v-for="i in 5" :key="i" :class="i <= h.puntuacion ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'" class="text-sm">★</span>
              </div>
              <svg :class="expandida === h.id_cita ? 'rotate-180' : ''" class="w-4 h-4 text-gray-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        <!-- Detalle expandible -->
        <div v-if="expandida === h.id_cita" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">

          <!-- Ficha técnica -->
          <div v-if="h.estado_pelaje || h.condicion_piel || h.peso_actual || h.observaciones || h.recomendaciones">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Ficha técnica</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div v-if="h.estado_pelaje">
                <span class="text-gray-500">Estado pelaje:</span>
                <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ h.estado_pelaje }}</span>
              </div>
              <div v-if="h.condicion_piel">
                <span class="text-gray-500">Piel:</span>
                <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ h.condicion_piel }}</span>
              </div>
              <div v-if="h.peso_actual">
                <span class="text-gray-500">Peso:</span>
                <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ h.peso_actual }} kg</span>
              </div>
              <div v-if="h.estado_ingreso">
                <span class="text-gray-500">Estado ingreso:</span>
                <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ h.estado_ingreso }}</span>
              </div>
            </div>
            <div v-if="h.observaciones" class="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span class="font-medium">Observaciones: </span>{{ h.observaciones }}
            </div>
            <div v-if="h.recomendaciones" class="mt-2 text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
              <span class="font-medium">Recomendaciones: </span>{{ h.recomendaciones }}
            </div>
          </div>

          <!-- Fotos -->
          <div v-if="h.fotos && h.fotos.length">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Fotos del servicio</p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="f in h.fotos" :key="f.url"
                class="relative cursor-pointer rounded-xl overflow-hidden w-20 h-20 flex-shrink-0 hover:opacity-90 transition"
                @click="fotoActiva = f.url"
              >
                <img :src="f.url" :alt="f.tipo" class="w-full h-full object-cover" />
                <span :class="['absolute bottom-0 inset-x-0 text-center text-xs py-0.5', TIPO_COLOR[f.tipo] ?? 'bg-gray-100 text-gray-700']">
                  {{ TIPO_FOTO[f.tipo] ?? f.tipo }}
                </span>
              </div>
            </div>
          </div>

          <!-- Calificación -->
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {{ h.puntuacion ? 'Tu calificación' : 'Calificar este servicio' }}
            </p>
            <div v-if="h.puntuacion" class="flex items-center gap-2 mb-2">
              <span v-for="i in 5" :key="i" :class="i <= h.puntuacion ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'" class="text-lg">★</span>
              <span class="text-sm text-gray-500">{{ h.puntuacion }}/5</span>
            </div>
            <p v-if="h.comentario_calificacion" class="text-sm text-gray-600 dark:text-gray-400 italic mb-2">"{{ h.comentario_calificacion }}"</p>
            <BaseButton size="sm" :variant="h.puntuacion ? 'secondary' : 'primary'" @click="abrirCalificar(h)">
              {{ h.puntuacion ? 'Actualizar calificación' : '★ Calificar' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Modal calificación -->
    <BaseModal :open="!!citaACalificar" title="Calificar servicio" @close="citaACalificar = null">
      <div v-if="citaACalificar" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>{{ citaACalificar.mascota }}</strong> · {{ citaACalificar.servicio }}
        </p>

        <!-- Estrellas interactivas -->
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Puntuación *</p>
          <div class="flex gap-2">
            <button
              v-for="i in 5" :key="i"
              :class="[
                'text-3xl transition-transform hover:scale-110',
                i <= puntuacion ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600',
              ]"
              @click="puntuacion = i"
            >★</button>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{ ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][puntuacion] }}
          </p>
        </div>

        <!-- Comentario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario (opcional)</label>
          <textarea
            v-model="comentario" rows="3"
            placeholder="¿Cómo fue la experiencia de tu mascota?"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div v-if="calificandoErr" class="text-xs text-red-600 dark:text-red-400">{{ calificandoErr }}</div>

        <div v-if="calificandoOk" class="text-center py-2">
          <p class="text-green-600 dark:text-green-400 font-medium">¡Gracias por tu calificación! 🐾</p>
        </div>

        <div v-else class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="citaACalificar = null">Cancelar</BaseButton>
          <BaseButton :disabled="!puntuacion" @click="confirmarCalificacion">Enviar calificación</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Lightbox foto -->
    <BaseModal :open="!!fotoActiva" title="" @close="fotoActiva = null">
      <div class="flex items-center justify-center">
        <img :src="fotoActiva ?? ''" class="max-w-full max-h-[70vh] rounded-xl object-contain" />
      </div>
    </BaseModal>
  </div>
</template>
