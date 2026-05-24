import { usePromocionesStore } from '@/presentation/stores/promociones.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { CreatePromocionPayload, UpdatePromocionPayload, VerificarPromocionPayload, VerificarPromocionResponse } from '@/shared/types/agenda.types'

export function usePromociones() {
  const store   = usePromocionesStore()
  const uiStore = useUiStore()

  async function loadAll(soloActivas = false): Promise<void> {
    await store.fetchAll(soloActivas)
  }

  async function verificarCodigo(payload: VerificarPromocionPayload): Promise<VerificarPromocionResponse | null> {
    try {
      return await store.verificar(payload)
    } catch {
      uiStore.showToast(store.error ?? 'Código de promoción inválido', 'error')
      return null
    }
  }

  async function createPromocion(payload: CreatePromocionPayload): Promise<boolean> {
    try {
      await store.create(payload)
      uiStore.showToast('Promoción creada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al crear promoción', 'error')
      return false
    }
  }

  async function updatePromocion(id: string, payload: UpdatePromocionPayload): Promise<boolean> {
    try {
      await store.update(id, payload)
      uiStore.showToast('Promoción actualizada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar promoción', 'error')
      return false
    }
  }

  async function eliminarPromocion(id: string): Promise<boolean> {
    try {
      await store.remove(id)
      uiStore.showToast('Promoción desactivada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar promoción', 'error')
      return false
    }
  }

  return { store, loadAll, verificarCodigo, createPromocion, updatePromocion, eliminarPromocion }
}
