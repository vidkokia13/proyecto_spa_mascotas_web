<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCitasStore }   from '@/presentation/stores/citas.store'
import { useDetalleStore } from '@/presentation/stores/detalle.store'
import { useDetalle }      from '@/presentation/composables/useDetalle'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const route       = useRoute()
const router      = useRouter()
const citasStore  = useCitasStore()
const detalleStore = useDetalleStore()
const { loadAll } = useDetalle()

const idCita = computed(() => route.params.id as string)
const cita   = computed(() => citasStore.selected)

const fotosAntes   = computed(() => detalleStore.fotos.filter(f => f.tipo === 'antes'))
const fotosDespues = computed(() => detalleStore.fotos.filter(f => f.tipo === 'despues'))
const fotosDurante = computed(() => detalleStore.fotos.filter(f => f.tipo === 'durante'))

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })
}
function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { dateStyle: 'medium' })
}

onMounted(async () => {
  await citasStore.fetchOne(idCita.value)
  await loadAll(idCita.value)
})

onUnmounted(() => {
  detalleStore.reset()
})
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">

    <!-- Back -->
    <button
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition"
      @click="router.push({ name: ROUTE_NAMES.CLIENT_CITAS })"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Volver a mis citas
    </button>

    <!-- Loading -->
    <div v-if="citasStore.loading" class="text-center py-16 text-gray-400">Cargando resumen…</div>

    <template v-else-if="cita">

      <!-- ── Encabezado ──────────────────────────────────────────────── -->
      <BaseCard>
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="space-y-1">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ cita.nombre_servicio }}</h1>
            <p class="text-sm text-gray-500">
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ cita.nombre_mascota }}</span>
              · {{ formatFecha(cita.fecha_hora_inicio) }}
            </p>
            <p v-if="cita.nombre_trabajador" class="text-sm text-gray-500">
              Atendido por: <span class="font-medium text-gray-700 dark:text-gray-300">{{ cita.nombre_trabajador }}</span>
            </p>
          </div>
          <BaseBadge color="bg-gray-100 text-gray-700">Completada</BaseBadge>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Duración</p>
            <p class="font-medium text-gray-800 dark:text-white">{{ cita.duracion_ajustada }} min</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Precio base</p>
            <p class="font-medium text-gray-800 dark:text-white">Bs {{ cita.precio_base?.toFixed(2) ?? '—' }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- ── Ficha técnica ───────────────────────────────────────────── -->
      <BaseCard v-if="detalleStore.ficha">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ficha técnica del servicio
        </h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div v-if="detalleStore.ficha.estado_pelaje" class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Estado del pelaje</p>
            <p class="text-gray-800 dark:text-white capitalize">{{ detalleStore.ficha.estado_pelaje }}</p>
          </div>
          <div v-if="detalleStore.ficha.condicion_piel" class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Condición de piel</p>
            <p class="text-gray-800 dark:text-white capitalize">{{ detalleStore.ficha.condicion_piel }}</p>
          </div>
          <div v-if="detalleStore.ficha.peso_actual" class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Peso registrado</p>
            <p class="text-gray-800 dark:text-white">{{ detalleStore.ficha.peso_actual }} kg</p>
          </div>
          <div v-if="detalleStore.ficha.estado_ingreso" class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-0.5">Estado al ingreso</p>
            <p class="text-gray-800 dark:text-white capitalize">{{ detalleStore.ficha.estado_ingreso }}</p>
          </div>
        </div>
        <div v-if="detalleStore.ficha.observaciones" class="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
          <p class="text-xs text-gray-400 mb-1">Observaciones</p>
          <p class="text-gray-700 dark:text-gray-300">{{ detalleStore.ficha.observaciones }}</p>
        </div>
        <div v-if="detalleStore.ficha.recomendaciones" class="mt-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2 text-sm border border-primary-100 dark:border-primary-800">
          <p class="text-xs text-primary-500 mb-1 font-medium">Recomendaciones del groomer</p>
          <p class="text-primary-800 dark:text-primary-200">{{ detalleStore.ficha.recomendaciones }}</p>
        </div>
      </BaseCard>

      <!-- ── Fotos ───────────────────────────────────────────────────── -->
      <BaseCard v-if="detalleStore.fotos.length > 0">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Fotos del servicio
        </h2>

        <div v-if="fotosAntes.length > 0" class="mb-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Antes</p>
          <div class="grid grid-cols-3 gap-2">
            <a v-for="f in fotosAntes" :key="f.id_foto" :href="f.url" target="_blank"
              class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 block">
              <img :src="f.url" class="w-full h-full object-cover hover:opacity-90 transition" />
            </a>
          </div>
        </div>

        <div v-if="fotosDurante.length > 0" class="mb-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durante</p>
          <div class="grid grid-cols-3 gap-2">
            <a v-for="f in fotosDurante" :key="f.id_foto" :href="f.url" target="_blank"
              class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 block">
              <img :src="f.url" class="w-full h-full object-cover hover:opacity-90 transition" />
            </a>
          </div>
        </div>

        <div v-if="fotosDespues.length > 0">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Después</p>
          <div class="grid grid-cols-3 gap-2">
            <a v-for="f in fotosDespues" :key="f.id_foto" :href="f.url" target="_blank"
              class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 block">
              <img :src="f.url" class="w-full h-full object-cover hover:opacity-90 transition" />
            </a>
          </div>
        </div>
      </BaseCard>

      <!-- ── Checklist completado ───────────────────────────────────── -->
      <BaseCard v-if="detalleStore.checklist.length > 0">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Servicios realizados
          <span class="ml-auto text-xs text-gray-400 font-normal">
            {{ detalleStore.checklist.filter(i => i.completado).length }}/{{ detalleStore.checklist.length }}
          </span>
        </h2>
        <ul class="space-y-1.5">
          <li v-for="item in detalleStore.checklist" :key="item.id_item"
            class="flex items-center gap-2.5 text-sm">
            <svg v-if="item.completado" class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span :class="item.completado ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'">
              {{ item.descripcion }}
            </span>
            <span v-if="item.completado_en" class="ml-auto text-xs text-gray-400 whitespace-nowrap">
              {{ formatFechaCorta(item.completado_en) }}
            </span>
          </li>
        </ul>
      </BaseCard>

      <!-- ── Insumos usados ─────────────────────────────────────────── -->
      <BaseCard v-if="detalleStore.citaInsumos.length > 0">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Insumos utilizados
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                <th class="text-left pb-2 font-medium">Producto</th>
                <th class="text-center pb-2 font-medium">Recibido</th>
                <th class="text-center pb-2 font-medium">Usado</th>
                <th class="text-center pb-2 font-medium">Devuelto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
              <tr v-for="ins in detalleStore.citaInsumos" :key="ins.id_cita_insumo">
                <td class="py-2 text-gray-800 dark:text-gray-200">
                  {{ ins.nombre_insumo }}
                  <span class="text-xs text-gray-400 ml-1">{{ ins.unidad }}</span>
                </td>
                <td class="py-2 text-center text-gray-600 dark:text-gray-400">{{ ins.cantidad_recibida }}</td>
                <td class="py-2 text-center text-gray-600 dark:text-gray-400">{{ ins.cantidad_usada }}</td>
                <td class="py-2 text-center text-gray-600 dark:text-gray-400">{{ ins.cantidad_devuelta }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- ── Calificación (UI solo, sin BD) ─────────────────────────── -->
      <BaseCard class="opacity-70">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Calificación y comentario
          </h2>
          <span class="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
            Próximamente
          </span>
        </div>

        <!-- Estrellas (deshabilitadas) -->
        <div class="flex gap-1 mb-3">
          <button v-for="n in 5" :key="n" disabled
            class="text-gray-200 dark:text-gray-700 cursor-not-allowed">
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>

        <!-- Comentario (deshabilitado) -->
        <textarea
          disabled
          rows="3"
          placeholder="Cuéntanos tu experiencia… (disponible próximamente)"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 px-3 py-2 text-sm resize-none cursor-not-allowed"
        />

        <div class="flex justify-end mt-3">
          <BaseButton disabled variant="primary" size="sm">Enviar calificación</BaseButton>
        </div>
      </BaseCard>

    </template>
  </div>
</template>
