import { useMascotasStore } from '@/presentation/stores/mascotas.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { CreateMascotaPayload, UpdateMascotaPayload } from '@/shared/types/agenda.types'

export function useMascotas() {
  const store   = useMascotasStore()
  const uiStore = useUiStore()

  async function loadAll(idUsuario?: string): Promise<void> {
    await store.fetchAll(idUsuario)
  }

  async function createMascota(payload: CreateMascotaPayload): Promise<boolean> {
    try {
      await store.create(payload)
      uiStore.showToast('Mascota registrada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al registrar mascota', 'error')
      return false
    }
  }

  async function updateMascota(id: string, payload: UpdateMascotaPayload): Promise<boolean> {
    try {
      await store.update(id, payload)
      uiStore.showToast('Mascota actualizada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar mascota', 'error')
      return false
    }
  }

  async function removeMascota(id: string): Promise<boolean> {
    try {
      await store.remove(id)
      uiStore.showToast('Mascota eliminada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar mascota', 'error')
      return false
    }
  }

  return { store, loadAll, createMascota, updateMascota, removeMascota }
}
