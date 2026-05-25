<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEmployeesStore } from '@/presentation/stores/employees.store'
import { useAgendaStore }    from '@/presentation/stores/agenda.store'
import { useUiStore }        from '@/presentation/stores/ui.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import type { Disponibilidad } from '@/shared/types/agenda.types'
import type { Employee }       from '@/shared/types/employee.types'

const empStore    = useEmployeesStore()
const agendaStore = useAgendaStore()
const uiStore     = useUiStore()

const DIA_LABEL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_ORDER = [1, 2, 3, 4, 5, 6, 0]

// ── Groomers list ─────────────────────────────────────────────────────────────
const groomers = computed(() =>
  empStore.employees.filter(e => e.rol === 'trabajador' && e.activo),
)

// ── Selected groomer & their availability ─────────────────────────────────────
const selected      = ref<Employee | null>(null)
const disponibilidad = ref<Disponibilidad[]>([])
const loadingDisp   = ref(false)

async function selectGroomer(g: Employee) {
  if (selected.value?.id_trabajador === g.id_trabajador) return
  selected.value   = g
  loadingDisp.value = true
  try {
    const res        = await import('@/data/datasources/AgendaDatasource').then(m =>
      m.agendaDatasource.getDisponibilidadGroomer(g.id_trabajador),
    )
    disponibilidad.value = res.disponibilidad
  } catch {
    disponibilidad.value = []
  } finally {
    loadingDisp.value = false
  }
}

function getDisp(dia: number): Disponibilidad | undefined {
  return disponibilidad.value.find(d => d.dia_semana === dia)
}

// ── Add availability modal ────────────────────────────────────────────────────
const showModal = ref(false)
const form      = ref({ diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' })

function openAdd() {
  const usedDays = new Set(disponibilidad.value.map(d => d.dia_semana))
  const free = DIAS_ORDER.find(d => !usedDays.has(d)) ?? 1
  form.value = { diaSemana: free, horaInicio: '09:00', horaFin: '18:00' }
  showModal.value = true
}

async function submitAdd() {
  if (!selected.value) return
  agendaStore.error = null
  try {
    const res = await import('@/data/datasources/AgendaDatasource').then(m =>
      m.agendaDatasource.setDisponibilidad({
        idTrabajador: selected.value!.id_trabajador,
        diaSemana:    form.value.diaSemana,
        horaInicio:   form.value.horaInicio,
        horaFin:      form.value.horaFin,
      }),
    )
    const idx = disponibilidad.value.findIndex(d => d.dia_semana === form.value.diaSemana)
    if (idx !== -1) disponibilidad.value[idx] = res.disponibilidad
    else disponibilidad.value.push(res.disponibilidad)
    showModal.value = false
    uiStore.showToast('Disponibilidad guardada', 'success')
  } catch (e: any) {
    uiStore.showToast(e?.response?.data?.message ?? 'Error al guardar', 'error')
  }
}

// ── Remove availability ───────────────────────────────────────────────────────
async function removeDisp(dia: number) {
  if (!selected.value) return
  if (!confirm(`¿Quitar disponibilidad del ${DIA_LABEL[dia]}?`)) return
  try {
    await import('@/data/datasources/AgendaDatasource').then(m =>
      m.agendaDatasource.removeDisponibilidad(selected.value!.id_trabajador, dia),
    )
    disponibilidad.value = disponibilidad.value.filter(d => d.dia_semana !== dia)
    uiStore.showToast('Disponibilidad eliminada', 'success')
  } catch (e: any) {
    uiStore.showToast(e?.response?.data?.message ?? 'Error al eliminar', 'error')
  }
}

// ── Días disponibles para el select (excluye los ya configurados excepto el actual) ──
const diasDisponibles = computed(() => {
  const usedDays = new Set(disponibilidad.value.map(d => d.dia_semana))
  return DIAS_ORDER.filter(d => !usedDays.has(d) || d === form.value.diaSemana)
})

onMounted(() => empStore.fetchAll())
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Disponibilidad de groomers</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

      <!-- ── Lista de groomers ── -->
      <div class="space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Groomers activos</p>

        <div v-if="empStore.loading" class="text-sm text-gray-400 text-center py-6">Cargando…</div>
        <div v-else-if="groomers.length === 0" class="text-sm text-gray-400 italic text-center py-6">
          No hay groomers activos.
        </div>

        <button
          v-for="g in groomers"
          :key="g.id_trabajador"
          :class="[
            'w-full text-left px-4 py-3 rounded-xl border transition',
            selected?.id_trabajador === g.id_trabajador
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300',
          ]"
          @click="selectGroomer(g)"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
              {{ g.nombre.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">{{ g.nombre }}</p>
              <p class="text-xs text-gray-400 truncate">{{ g.especialidad ?? 'Sin especialidad' }}</p>
            </div>
          </div>
        </button>
      </div>

      <!-- ── Disponibilidad del groomer seleccionado ── -->
      <div class="md:col-span-2">
        <div v-if="!selected" class="flex items-center justify-center h-full min-h-48 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p class="text-gray-400 text-sm">Selecciona un groomer para ver su disponibilidad</p>
        </div>

        <div v-else>
          <BaseCard>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">{{ selected.nombre }}</h2>
                <p class="text-xs text-gray-400">{{ disponibilidad.length }} día(s) configurados</p>
              </div>
              <BaseButton size="sm" :disabled="disponibilidad.length >= 7" @click="openAdd">
                + Agregar día
              </BaseButton>
            </div>

            <div v-if="loadingDisp" class="text-center py-8 text-gray-400 text-sm">Cargando disponibilidad…</div>

            <div v-else class="space-y-2">
              <div
                v-for="dia in DIAS_ORDER"
                :key="dia"
                :class="[
                  'flex items-center justify-between px-4 py-3 rounded-lg',
                  getDisp(dia) ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50',
                ]"
              >
                <div class="flex items-center gap-3">
                  <span :class="['text-sm font-medium w-24', getDisp(dia) ? 'text-gray-900 dark:text-white' : 'text-gray-400']">
                    {{ DIA_LABEL[dia] }}
                  </span>
                  <span v-if="getDisp(dia)" class="text-sm text-green-700 dark:text-green-400">
                    {{ getDisp(dia)!.hora_inicio.slice(0,5) }} – {{ getDisp(dia)!.hora_fin.slice(0,5) }}
                  </span>
                  <span v-else class="text-xs text-gray-400 italic">Sin disponibilidad</span>
                </div>

                <button
                  v-if="getDisp(dia)"
                  class="text-xs text-red-500 hover:text-red-700 transition"
                  @click="removeDisp(dia)"
                >
                  Quitar
                </button>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- ── Modal agregar día ── -->
    <BaseModal :open="showModal" title="Agregar disponibilidad" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submitAdd">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Día</label>
          <select v-model.number="form.diaSemana"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
            <option v-for="d in diasDisponibles" :key="d" :value="d">{{ DIA_LABEL[d] }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora inicio</label>
            <input v-model="form.horaInicio" type="time" required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora fin</label>
            <input v-model="form.horaFin" type="time" required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>
        <p class="text-xs text-gray-400">
          Si el día ya tiene disponibilidad configurada, esta la reemplazará.
        </p>
        <div class="flex justify-end gap-3 pt-1">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
