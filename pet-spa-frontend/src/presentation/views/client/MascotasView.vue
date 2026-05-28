<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMascotas } from '@/presentation/composables/useMascotas'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal from '@/presentation/components/ui/BaseModal.vue'
import BaseInput from '@/presentation/components/ui/BaseInput.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import type { Mascota, CreateMascotaPayload } from '@/shared/types/agenda.types'

const { store, loadAll, createMascota, updateMascota, removeMascota, subirCarnet } = useMascotas()

const showModal   = ref(false)
const editing     = ref<Mascota | null>(null)
const confirmDel  = ref<string | null>(null)

const carnetId    = ref<string | null>(null)
const carnetFile  = ref<File | null>(null)
const carnetInput = ref<HTMLInputElement | null>(null)

const TAMANOS       = ['pequeno', 'mediano', 'grande', 'gigante'] as const
const TEMPERAMENTOS = ['tranquilo', 'nervioso', 'agresivo', 'inquieto'] as const
const ESPECIES      = ['perro', 'gato', 'conejo', 'otro']

const TAMANO_LABEL: Record<string, string> = {
  pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande', gigante: 'Gigante',
}
const TEMP_LABEL: Record<string, string> = {
  tranquilo: 'Tranquilo', nervioso: 'Nervioso', agresivo: 'Agresivo', inquieto: 'Inquieto',
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
  inquieto:  'bg-purple-100 text-purple-700',
}

const emptyForm = (): CreateMascotaPayload => ({
  nombre: '', especie: 'perro', raza: null,
  tamano: 'mediano', temperamento: 'tranquilo',
  fechaNacimiento: null, alergias: null,
  tiempoExtraMin: 0, pesoKg: null, notas: null,
})

const form = ref<CreateMascotaPayload>(emptyForm())

function openCreate() {
  editing.value   = null
  form.value      = emptyForm()
  showModal.value = true
}

function openEdit(m: Mascota) {
  editing.value = m
  form.value = {
    nombre:          m.nombre,
    especie:         m.especie,
    raza:            m.raza,
    tamano:          m.tamano,
    temperamento:    m.temperamento,
    fechaNacimiento: m.fecha_nacimiento,
    alergias:        m.alergias,
    tiempoExtraMin:  m.tiempo_extra_min,
    pesoKg:          m.peso_kg,
    notas:           m.notas,
  }
  showModal.value = true
}

async function submit() {
  const ok = editing.value
    ? await updateMascota(editing.value.id_mascota, form.value)
    : await createMascota(form.value)
  if (ok) showModal.value = false
}

async function confirmDelete() {
  if (!confirmDel.value) return
  const ok = await removeMascota(confirmDel.value)
  if (ok) confirmDel.value = null
}

function openCarnet(id: string) {
  carnetId.value   = id
  carnetFile.value = null
  carnetInput.value?.click()
}

function onCarnetSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) carnetFile.value = file
}

async function submitCarnet() {
  if (!carnetId.value || !carnetFile.value) return
  await subirCarnet(carnetId.value, carnetFile.value)
  carnetId.value   = null
  carnetFile.value = null
  if (carnetInput.value) carnetInput.value.value = ''
}

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return ''
  const diff = Date.now() - new Date(fechaNac).getTime()
  const años  = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  if (años >= 1) return `${años} año${años !== 1 ? 's' : ''}`
  const meses = Math.floor(diff / (30.44 * 24 * 3600 * 1000))
  return meses > 0 ? `${meses} mes${meses !== 1 ? 'es' : ''}` : 'Recién nacido'
}

const isCarnetPdf = (url: string) => url.toLowerCase().includes('/raw/')

const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none'

onMounted(() => loadAll())
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis mascotas</h1>
      <BaseButton @click="openCreate">+ Registrar mascota</BaseButton>
    </div>

    <input
      ref="carnetInput"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,.pdf"
      class="hidden"
      @change="onCarnetSelected"
    />

    <div v-if="store.loading && store.mascotas.length === 0" class="text-center py-12 text-gray-500">
      Cargando…
    </div>

    <div v-else-if="store.mascotas.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400 mb-4">No tienes mascotas registradas aún.</p>
      <BaseButton @click="openCreate">Registrar mi primera mascota</BaseButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BaseCard v-for="m in store.mascotas" :key="m.id_mascota" class="flex flex-col gap-3">
        <!-- Avatar + Nombre + acciones -->
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
            <svg class="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ m.nombre }}</h2>
                <p class="text-sm text-gray-500 capitalize">
                  {{ m.especie }}<span v-if="m.raza"> · {{ m.raza }}</span>
                  <span v-if="m.fecha_nacimiento" class="text-gray-400"> · {{ calcEdad(m.fecha_nacimiento) }}</span>
                </p>
              </div>
              <div class="flex gap-2 flex-shrink-0">
                <button class="text-gray-400 hover:text-primary-600 transition" title="Editar" @click="openEdit(m)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="text-gray-400 hover:text-red-500 transition" title="Eliminar" @click="confirmDel = m.id_mascota">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Badges -->
        <div class="flex flex-wrap gap-2">
          <BaseBadge :color="tamanoColor[m.tamano]">{{ TAMANO_LABEL[m.tamano] }}</BaseBadge>
          <BaseBadge :color="tempColor[m.temperamento]">{{ TEMP_LABEL[m.temperamento] }}</BaseBadge>
          <span v-if="m.peso_kg" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {{ m.peso_kg }} kg
          </span>
        </div>

        <!-- Alergias -->
        <div v-if="m.alergias" class="flex items-start gap-1.5">
          <svg class="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-xs text-orange-700 dark:text-orange-400">{{ m.alergias }}</p>
        </div>

        <!-- Notas -->
        <p v-if="m.notas" class="text-xs text-gray-500 dark:text-gray-400 italic">{{ m.notas }}</p>

        <!-- Carnet de vacunas -->
        <div class="border-t border-gray-100 dark:border-gray-700 pt-2 mt-1 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span v-if="m.carnet_vacunas_url" class="text-xs truncate">
              <a :href="m.carnet_vacunas_url" target="_blank" class="text-primary-600 hover:underline">
                {{ isCarnetPdf(m.carnet_vacunas_url) ? 'Ver carnet (PDF)' : 'Ver carnet (imagen)' }}
              </a>
            </span>
            <span v-else class="text-xs text-gray-400">Sin carnet de vacunas</span>
          </div>
          <button
            class="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
            @click="openCarnet(m.id_mascota)"
          >
            {{ m.carnet_vacunas_url ? 'Actualizar' : 'Subir' }}
          </button>
        </div>

        <!-- Preview carnet pendiente de subir -->
        <div v-if="carnetId === m.id_mascota && carnetFile" class="flex items-center justify-between gap-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
          <span class="text-xs text-primary-700 dark:text-primary-300 truncate">{{ carnetFile.name }}</span>
          <div class="flex gap-2 flex-shrink-0">
            <button class="text-xs text-gray-500 hover:text-gray-700" @click="carnetFile = null; carnetId = null">✕</button>
            <BaseButton size="sm" :disabled="store.loading" @click="submitCarnet">
              {{ store.loading ? 'Subiendo…' : 'Confirmar' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- ── Modal crear / editar ──────────────────────────────────── -->
    <BaseModal :open="showModal" :title="editing ? 'Editar mascota' : 'Registrar mascota'" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submit">
        <BaseInput v-model="form.nombre" label="Nombre *" required placeholder="Nombre de tu mascota" />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especie</label>
            <select v-model="form.especie" :class="inputClass">
              <option v-for="e in ESPECIES" :key="e" :value="e" class="capitalize">{{ e }}</option>
            </select>
          </div>
          <BaseInput v-model="form.raza" label="Raza (opcional)" placeholder="Raza" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamaño</label>
            <select v-model="form.tamano" :class="inputClass">
              <option v-for="t in TAMANOS" :key="t" :value="t">{{ TAMANO_LABEL[t] }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperamento</label>
            <select v-model="form.temperamento" :class="inputClass">
              <option v-for="t in TEMPERAMENTOS" :key="t" :value="t">{{ TEMP_LABEL[t] }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de nacimiento</label>
            <input v-model="form.fechaNacimiento" type="date" :max="new Date().toISOString().slice(0,10)" :class="inputClass" />
          </div>
          <BaseInput v-model.number="form.pesoKg" label="Peso (kg, opcional)" type="number" step="0.1" min="0" placeholder="Ej: 5.5" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Alergias o restricciones médicas
          </label>
          <textarea v-model="form.alergias" rows="2"
            placeholder="Ej: alergia a la lavanda, no tolera champú con sílice…"
            :class="inputClass + ' resize-none'" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas adicionales</label>
          <textarea v-model="form.notas" rows="2" placeholder="Comportamiento especial, instrucciones…"
            :class="inputClass + ' resize-none'" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Registrar') }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- ── Modal confirmar eliminación ──────────────────────────── -->
    <BaseModal :open="!!confirmDel" title="Eliminar mascota" @close="confirmDel = null">
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        ¿Seguro que deseas eliminar esta mascota? Esta acción no se puede deshacer.
      </p>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="confirmDel = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="store.loading" @click="confirmDelete">
          {{ store.loading ? 'Eliminando…' : 'Eliminar' }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
