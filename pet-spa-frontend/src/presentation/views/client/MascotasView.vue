<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMascotas } from '@/presentation/composables/useMascotas'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal from '@/presentation/components/ui/BaseModal.vue'
import BaseInput from '@/presentation/components/ui/BaseInput.vue'
import type { Mascota, CreateMascotaPayload } from '@/shared/types/agenda.types'

const { store, loadAll, createMascota, updateMascota, removeMascota } = useMascotas()

const showModal   = ref(false)
const editing     = ref<Mascota | null>(null)
const confirmDel  = ref<string | null>(null)

const TAMANOS     = ['pequeno', 'mediano', 'grande', 'gigante'] as const
const TEMPERAMENTOS = ['tranquilo', 'nervioso', 'agresivo'] as const
const ESPECIES    = ['perro', 'gato', 'conejo', 'otro']

const TAMANO_LABEL: Record<string, string> = {
  pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande', gigante: 'Gigante',
}
const TEMP_LABEL: Record<string, string> = {
  tranquilo: 'Tranquilo', nervioso: 'Nervioso', agresivo: 'Agresivo',
}

const form = ref<CreateMascotaPayload>({
  nombre: '', especie: 'perro', raza: null,
  tamano: 'mediano', temperamento: 'tranquilo',
  tiempoExtraMin: 0, pesoKg: null, notas: null,
})

function openCreate() {
  editing.value = null
  form.value = { nombre: '', especie: 'perro', raza: null, tamano: 'mediano', temperamento: 'tranquilo', tiempoExtraMin: 0, pesoKg: null, notas: null }
  showModal.value = true
}

function openEdit(m: Mascota) {
  editing.value = m
  form.value = {
    nombre: m.nombre, especie: m.especie, raza: m.raza,
    tamano: m.tamano, temperamento: m.temperamento,
    tiempoExtraMin: m.tiempo_extra_min, pesoKg: m.peso_kg, notas: m.notas,
  }
  showModal.value = true
}

async function submit() {
  let ok: boolean
  if (editing.value) {
    ok = await updateMascota(editing.value.id_mascota, form.value)
  } else {
    ok = await createMascota(form.value)
  }
  if (ok) showModal.value = false
}

async function confirmDelete() {
  if (!confirmDel.value) return
  const ok = await removeMascota(confirmDel.value)
  if (ok) confirmDel.value = null
}

const tamanoColor: Record<string, string> = {
  pequeno: 'bg-green-100 text-green-700',
  mediano: 'bg-blue-100 text-blue-700',
  grande:  'bg-orange-100 text-orange-700',
  gigante: 'bg-red-100 text-red-700',
}
const tempColor: Record<string, string> = {
  tranquilo: 'bg-green-100 text-green-700',
  nervioso:  'bg-yellow-100 text-yellow-700',
  agresivo:  'bg-red-100 text-red-700',
}

onMounted(() => loadAll())
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis mascotas</h1>
      <BaseButton @click="openCreate">+ Registrar mascota</BaseButton>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">Cargando…</div>

    <div v-else-if="store.mascotas.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">No tienes mascotas registradas aún.</p>
      <BaseButton class="mt-4" @click="openCreate">Registrar mi primera mascota</BaseButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BaseCard v-for="m in store.mascotas" :key="m.id_mascota" class="flex flex-col gap-3">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ m.nombre }}</h2>
            <p class="text-sm text-gray-500 capitalize">{{ m.especie }}<span v-if="m.raza"> · {{ m.raza }}</span></p>
          </div>
          <div class="flex gap-2">
            <button class="text-gray-400 hover:text-primary-600 transition" title="Editar" @click="openEdit(m)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button class="text-gray-400 hover:text-red-600 transition" title="Eliminar" @click="confirmDel = m.id_mascota">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', tamanoColor[m.tamano]]">
            {{ TAMANO_LABEL[m.tamano] }}
          </span>
          <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', tempColor[m.temperamento]]">
            {{ TEMP_LABEL[m.temperamento] }}
          </span>
          <span v-if="m.peso_kg" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {{ m.peso_kg }} kg
          </span>
        </div>

        <p v-if="m.notas" class="text-xs text-gray-500 dark:text-gray-400 italic">{{ m.notas }}</p>
      </BaseCard>
    </div>

    <!-- Create / Edit Modal -->
    <BaseModal :open="showModal" :title="editing ? 'Editar mascota' : 'Registrar mascota'" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submit">
        <BaseInput v-model="form.nombre" label="Nombre" required placeholder="Nombre de tu mascota" />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especie</label>
            <select v-model="form.especie"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option v-for="e in ESPECIES" :key="e" :value="e" class="capitalize">{{ e }}</option>
            </select>
          </div>
          <BaseInput v-model="form.raza" label="Raza (opcional)" placeholder="Raza" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamaño</label>
            <select v-model="form.tamano"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option v-for="t in TAMANOS" :key="t" :value="t">{{ TAMANO_LABEL[t] }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperamento</label>
            <select v-model="form.temperamento"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option v-for="t in TEMPERAMENTOS" :key="t" :value="t">{{ TEMP_LABEL[t] }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model.number="form.pesoKg" label="Peso (kg, opcional)" type="number" step="0.1" min="0" placeholder="Ej: 5.5" />
          <BaseInput v-model.number="form.tiempoExtraMin" label="Tiempo extra (min)" type="number" min="0" placeholder="0" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas (opcional)</label>
          <textarea v-model="form.notas" rows="2" placeholder="Alergias, comportamiento especial…"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Registrar') }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Delete confirmation -->
    <BaseModal :open="!!confirmDel" title="Eliminar mascota" @close="confirmDel = null">
      <p class="text-gray-600 dark:text-gray-400 mb-6">¿Seguro que deseas eliminar esta mascota? Esta acción no se puede deshacer.</p>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="confirmDel = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="store.loading" @click="confirmDelete">
          {{ store.loading ? 'Eliminando…' : 'Eliminar' }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
