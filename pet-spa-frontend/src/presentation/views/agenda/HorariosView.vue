<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAgenda } from '@/presentation/composables/useAgenda'
import BaseCard from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal from '@/presentation/components/ui/BaseModal.vue'
import BaseInput from '@/presentation/components/ui/BaseInput.vue'

const { store, loadHorarios, saveHorario, toggleHorario } = useAgenda()

const DIA_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const showModal  = ref(false)
const editingDia = ref<number | null>(null)

const form = ref({ diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', capacidadMax: 5 })

function openEdit(dia: number) {
  editingDia.value = dia
  const h = store.horarios.find(x => x.dia_semana === dia)
  form.value = {
    diaSemana:   dia,
    horaInicio:  h?.hora_inicio.slice(0, 5) ?? '09:00',
    horaFin:     h?.hora_fin.slice(0, 5)    ?? '18:00',
    capacidadMax: h?.capacidad_max ?? 5,
  }
  showModal.value = true
}

function openCreate() {
  editingDia.value = null
  form.value = { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', capacidadMax: 5 }
  showModal.value = true
}

async function submit() {
  const ok = await saveHorario(form.value)
  if (ok) showModal.value = false
}

const DIAS_ORDER = [1, 2, 3, 4, 5, 6, 0]

function getHorario(dia: number) {
  return store.horarios.find(h => h.dia_semana === dia)
}

onMounted(loadHorarios)
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Horarios del spa</h1>
      <BaseButton @click="openCreate">+ Agregar horario</BaseButton>
    </div>

    <div v-if="store.loading && store.horarios.length === 0" class="text-center py-12 text-gray-400">Cargando…</div>

    <div class="space-y-3">
      <BaseCard v-for="dia in DIAS_ORDER" :key="dia">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="font-semibold text-gray-900 dark:text-white w-24 flex-shrink-0">{{ DIA_LABEL[dia] }}</span>

            <div v-if="getHorario(dia)" class="flex items-center gap-2 flex-wrap">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ getHorario(dia)!.hora_inicio.slice(0, 5) }} – {{ getHorario(dia)!.hora_fin.slice(0, 5) }}
              </span>
              <span class="text-xs text-gray-500">· cap. {{ getHorario(dia)!.capacidad_max }}</span>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  getHorario(dia)!.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                ]"
              >
                {{ getHorario(dia)!.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <span v-else class="text-sm text-gray-400 italic">Sin horario configurado</span>
          </div>

          <div class="flex gap-2 flex-shrink-0">
            <BaseButton v-if="getHorario(dia)" size="sm" variant="secondary"
              @click="toggleHorario(dia, !getHorario(dia)!.activo)">
              {{ getHorario(dia)!.activo ? 'Desactivar' : 'Activar' }}
            </BaseButton>
            <BaseButton size="sm" @click="openEdit(dia)">
              {{ getHorario(dia) ? 'Editar' : 'Configurar' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="showModal" title="Configurar horario" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Día</label>
          <select v-model.number="form.diaSemana"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
            <option v-for="d in DIAS_ORDER" :key="d" :value="d">{{ DIA_LABEL[d] }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model="form.horaInicio" label="Hora apertura" type="time" required />
          <BaseInput v-model="form.horaFin" label="Hora cierre" type="time" required />
        </div>
        <BaseInput v-model.number="form.capacidadMax" label="Capacidad máxima (citas simultáneas)" type="number" min="1" required />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Guardando…' : 'Guardar' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
