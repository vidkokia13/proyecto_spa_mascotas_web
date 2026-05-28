<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEmployees } from '@/presentation/composables/useEmployees'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import BaseCard    from '@/presentation/components/ui/BaseCard.vue'
import BaseTable   from '@/presentation/components/ui/BaseTable.vue'
import BaseModal   from '@/presentation/components/ui/BaseModal.vue'
import BaseInput   from '@/presentation/components/ui/BaseInput.vue'
import BaseBadge   from '@/presentation/components/ui/BaseBadge.vue'
import { ROLE_LABELS, ROLE_COLORS, ESTADO_COLORS, ESTADO_LABELS } from '@/shared/constants/roles'
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload } from '@/shared/types/employee.types'

const { store, loadAll, createEmployee, updateEmployee, toggleStatus } = useEmployees()

onMounted(loadAll)

const columns = [
  { key: 'nombre',      label: 'Nombre'      },
  { key: 'email',       label: 'Email'        },
  { key: 'rol',         label: 'Rol'          },
  { key: 'especialidad',label: 'Especialidad' },
  { key: 'turno',       label: 'Turno'        },
  { key: 'estado',      label: 'Estado'       },
]

// ─── Create modal ───────────────────────────────────────────────────────────
const showCreate = ref(false)
const createForm = ref<CreateEmployeePayload>({
  nombre: '', email: '', password: '', rol: 'trabajador',
  sueldoMensual: null, activo: true, turno: null,
  telefono: null, especialidad: null, capacidadSimultanea: 1,
})
const createLoading  = ref(false)
const createError    = ref('')

// El admin puede asignar una contraseña temporal simple (ej: CI del empleado).
// El backend acepta mínimo 4 caracteres; el empleado debe cambiarla al primer login.
const canCreate = computed(() =>
  createForm.value.nombre.trim().length >= 2 &&
  createForm.value.email.trim().length > 0 &&
  createForm.value.password.length >= 4,
)

function openCreate() {
  createForm.value = {
    nombre: '', email: '', password: '', rol: 'trabajador',
    sueldoMensual: null, activo: true, turno: null,
    telefono: null, especialidad: null, capacidadSimultanea: 1,
  }
  createError.value = ''
  showCreate.value  = true
}

async function submitCreate() {
  if (!canCreate.value) return
  createLoading.value = true
  createError.value   = ''
  const ok = await createEmployee(createForm.value)
  createLoading.value = false
  if (ok) showCreate.value = false
  else createError.value = store.error ?? 'Error al crear'
}

// ─── Edit modal ─────────────────────────────────────────────────────────────
const showEdit      = ref(false)
const editTarget    = ref<Employee | null>(null)
const editForm      = ref<UpdateEmployeePayload>({})
const editLoading   = ref(false)
const editError     = ref('')

function openEdit(emp: Employee) {
  editTarget.value = emp
  editForm.value   = {
    estado:           emp.estado as 'activo' | 'inactivo',
    turno:            emp.turno,
    especialidad:     emp.especialidad,
    activo:           emp.activo,
    telefono:         emp.telefono,
    sueldoMensual:    emp.sueldo_mensual,
    capacidadSimultanea: emp.capacidad_simultanea,
  }
  editError.value = ''
  showEdit.value  = true
}

async function submitEdit() {
  if (!editTarget.value) return
  editLoading.value = true
  editError.value   = ''
  const ok = await updateEmployee(editTarget.value.id_usuario, editForm.value)
  editLoading.value = false
  if (ok) showEdit.value = false
  else editError.value = store.error ?? 'Error al actualizar'
}

const searchQuery = ref('')
const filteredRows = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return store.employees
  return store.employees.filter(e =>
    e.nombre.toLowerCase().includes(q) ||
    e.email.toLowerCase().includes(q) ||
    e.rol.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Gestión de empleados y personal interno</p>
      </div>
      <BaseButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo empleado
      </BaseButton>
    </div>

    <BaseCard>
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por nombre, email o rol…"
          class="w-full sm:max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <BaseTable :columns="columns" :rows="filteredRows as Record<string, unknown>[]" :loading="store.loading">
        <template #rol="{ row }">
          <BaseBadge :color="ROLE_COLORS[((row as unknown) as Employee).rol]">
            {{ ROLE_LABELS[((row as unknown) as Employee).rol] ?? ((row as unknown) as Employee).rol }}
          </BaseBadge>
        </template>
        <template #especialidad="{ row }">
          {{ ((row as unknown) as Employee).especialidad ?? '—' }}
        </template>
        <template #turno="{ row }">
          {{ ((row as unknown) as Employee).turno ?? '—' }}
        </template>
        <template #estado="{ row }">
          <BaseBadge :color="ESTADO_COLORS[((row as unknown) as Employee).estado]">
            {{ ESTADO_LABELS[((row as unknown) as Employee).estado] ?? ((row as unknown) as Employee).estado }}
          </BaseBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseButton size="sm" variant="ghost" @click="openEdit((row as unknown) as Employee)">
              Editar
            </BaseButton>
            <BaseButton
              size="sm"
              :variant="((row as unknown) as Employee).estado === 'activo' ? 'danger' : 'secondary'"
              @click="toggleStatus(((row as unknown) as Employee).id_usuario, ((row as unknown) as Employee).estado)"
            >
              {{ ((row as unknown) as Employee).estado === 'activo' ? 'Desactivar' : 'Activar' }}
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- Create modal -->
    <BaseModal :open="showCreate" title="Nuevo empleado" size="lg" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div v-if="createError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {{ createError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="createForm.nombre" label="Nombre completo" placeholder="Juan Pérez" required />
          <BaseInput v-model="createForm.email" label="Email" type="email" placeholder="juan@petspa.com" required />
        </div>

        <div>
          <BaseInput v-model="createForm.password" label="Contraseña temporal" type="password" placeholder="Ej: CI del empleado" required />
          <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contraseña temporal — el empleado deberá cambiarla al primer inicio de sesión.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Rol <span class="text-red-500">*</span></label>
            <select
              v-model="createForm.rol"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="trabajador">Groomer / Empleado</option>
              <option value="recepcion">Recepcionista</option>
              <option value="jefe">Jefe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <BaseInput v-model="createForm.telefono" label="Teléfono" placeholder="+598 99 000 000" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Turno</label>
            <select
              v-model="createForm.turno"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Sin turno</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
            <select
              v-model="createForm.especialidad"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Sin especialidad</option>
              <option value="groomer">Groomer</option>
              <option value="veterinaria">Veterinaria</option>
              <option value="recepcion">Recepción</option>
              <option value="administracion">Administración</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sueldo mensual</label>
            <input
              v-model.number="createForm.sueldoMensual"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Capacidad simultánea</label>
            <input
              v-model.number="createForm.capacidadSimultanea"
              type="number"
              min="1"
              max="20"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreate = false">Cancelar</BaseButton>
        <BaseButton :loading="createLoading" :disabled="!canCreate" @click="submitCreate">
          Crear empleado
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Edit modal -->
    <BaseModal :open="showEdit" :title="`Editar: ${editTarget?.nombre}`" size="lg" @close="showEdit = false">
      <form class="space-y-4" @submit.prevent="submitEdit">
        <div v-if="editError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {{ editError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
            <select
              v-model="editForm.estado"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <BaseInput v-model="editForm.telefono" label="Teléfono" placeholder="+598 99 000 000" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Turno</label>
            <select
              v-model="editForm.turno"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Sin turno</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
            <select
              v-model="editForm.especialidad"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">Sin especialidad</option>
              <option value="groomer">Groomer</option>
              <option value="veterinaria">Veterinaria</option>
              <option value="recepcion">Recepción</option>
              <option value="administracion">Administración</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sueldo mensual</label>
            <input
              v-model.number="editForm.sueldoMensual"
              type="number"
              min="0"
              step="0.01"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Capacidad simultánea</label>
            <input
              v-model.number="editForm.capacidadSimultanea"
              type="number"
              min="1"
              max="20"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="showEdit = false">Cancelar</BaseButton>
        <BaseButton :loading="editLoading" @click="submitEdit">Guardar cambios</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
