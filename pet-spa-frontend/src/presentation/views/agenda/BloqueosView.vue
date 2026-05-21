<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAgenda } from '@/presentation/composables/useAgenda'
import { useAuthStore } from '@/presentation/stores/auth.store'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal from '@/presentation/components/ui/BaseModal.vue'
import BaseInput from '@/presentation/components/ui/BaseInput.vue'

const authStore = useAuthStore()
const { store, loadBloqueos, createBloqueo, deleteBloqueo } = useAgenda()

const canDelete = computed(() => ['admin', 'jefe'].includes(authStore.userRole ?? ''))
const canCreate = computed(() => ['admin', 'jefe'].includes(authStore.userRole ?? ''))

const showModal  = ref(false)
const confirmDel = ref<string | null>(null)

const form = ref({
  tipo: 'cierre',
  fechaInicio: '',
  fechaFin: '',
  motivo: '',
})

const TIPO_LABEL: Record<string, string> = {
  cierre: 'Cierre del spa',
  vacaciones: 'Vacaciones',
  mantenimiento: 'Mantenimiento',
  feriado: 'Feriado',
  otro: 'Otro',
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}

function openCreate() {
  form.value = { tipo: 'cierre', fechaInicio: '', fechaFin: '', motivo: '' }
  showModal.value = true
}

async function submit() {
  if (!form.value.fechaInicio || !form.value.fechaFin) return
  const ok = await createBloqueo({
    tipo:        form.value.tipo,
    fechaInicio: form.value.fechaInicio,
    fechaFin:    form.value.fechaFin,
    motivo:      form.value.motivo || null,
  })
  if (ok) showModal.value = false
}

async function confirmDelete() {
  if (!confirmDel.value) return
  const ok = await deleteBloqueo(confirmDel.value)
  if (ok) confirmDel.value = null
}

onMounted(loadBloqueos)
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Bloqueos</h1>
      <BaseButton v-if="canCreate" @click="openCreate">+ Nuevo bloqueo</BaseButton>
    </div>

    <div v-if="store.loading && store.bloqueos.length === 0" class="text-center py-12 text-gray-400">Cargando…</div>

    <div v-else-if="store.bloqueos.length === 0" class="text-center py-16">
      <p class="text-gray-500">No hay bloqueos registrados.</p>
    </div>

    <div v-else class="space-y-3">
      <BaseCard v-for="b in store.bloqueos" :key="b.id_bloqueo">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {{ TIPO_LABEL[b.tipo] ?? b.tipo }}
              </span>
              <span v-if="!b.id_trabajador" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Todo el spa
              </span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ formatFecha(b.fecha_inicio) }} → {{ formatFecha(b.fecha_fin) }}
            </p>
            <p v-if="b.motivo" class="text-xs text-gray-500 italic mt-1">{{ b.motivo }}</p>
          </div>
          <button v-if="canDelete" class="text-gray-400 hover:text-red-600 transition flex-shrink-0"
            @click="confirmDel = b.id_bloqueo">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </BaseCard>
    </div>

    <!-- Create Modal -->
    <BaseModal :open="showModal" title="Nuevo bloqueo" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
          <select v-model="form.tipo"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
            <option v-for="(label, val) in TIPO_LABEL" :key="val" :value="val">{{ label }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model="form.fechaInicio" label="Desde" type="datetime-local" required />
          <BaseInput v-model="form.fechaFin" label="Hasta" type="datetime-local" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo (opcional)</label>
          <textarea v-model="form.motivo" rows="2" placeholder="Ej: Reunión de equipo, limpieza general…"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Guardando…' : 'Crear bloqueo' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Delete confirmation -->
    <BaseModal :open="!!confirmDel" title="Eliminar bloqueo" @close="confirmDel = null">
      <p class="text-gray-600 dark:text-gray-400 mb-6">¿Seguro que deseas eliminar este bloqueo?</p>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="confirmDel = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="store.loading" @click="confirmDelete">
          {{ store.loading ? 'Eliminando…' : 'Eliminar' }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
