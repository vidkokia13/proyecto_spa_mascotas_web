import { useEmployeesStore } from '@/presentation/stores/employees.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { CreateEmployeePayload, UpdateEmployeePayload } from '@/shared/types/employee.types'

export function useEmployees() {
  const store   = useEmployeesStore()
  const uiStore = useUiStore()

  async function loadAll(): Promise<void> {
    await store.fetchAll()
  }

  async function createEmployee(payload: CreateEmployeePayload): Promise<boolean> {
    try {
      await store.create(payload)
      uiStore.showToast('Empleado creado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al crear empleado', 'error')
      return false
    }
  }

  async function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<boolean> {
    try {
      await store.update(id, payload)
      uiStore.showToast('Empleado actualizado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar empleado', 'error')
      return false
    }
  }

  async function toggleStatus(id: string, currentEstado: string): Promise<void> {
    const next = currentEstado === 'activo' ? 'inactivo' : 'activo'
    await updateEmployee(id, { estado: next })
  }

  return { store, loadAll, createEmployee, updateEmployee, toggleStatus }
}
