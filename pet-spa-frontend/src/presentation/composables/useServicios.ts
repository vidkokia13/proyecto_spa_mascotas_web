import { useServiciosStore } from '@/presentation/stores/servicios.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { CreateServicioPayload, UpdateServicioPayload } from '@/shared/types/agenda.types'

export function useServicios() {
  const store   = useServiciosStore()
  const uiStore = useUiStore()

  async function loadAll(soloActivos = true): Promise<void> {
    await store.fetchAll(soloActivos)
  }

  async function createServicio(payload: CreateServicioPayload): Promise<boolean> {
    try {
      await store.create(payload)
      uiStore.showToast('Servicio creado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al crear servicio', 'error')
      return false
    }
  }

  async function updateServicio(id: string, payload: UpdateServicioPayload): Promise<boolean> {
    try {
      await store.update(id, payload)
      uiStore.showToast('Servicio actualizado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar servicio', 'error')
      return false
    }
  }

  async function toggleServicio(id: string, activo: boolean): Promise<void> {
    await updateServicio(id, { activo })
  }

  return { store, loadAll, createServicio, updateServicio, toggleServicio }
}
