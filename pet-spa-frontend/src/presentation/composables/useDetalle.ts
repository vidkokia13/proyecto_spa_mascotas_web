import { useDetalleStore } from '@/presentation/stores/detalle.store'
import { useUiStore }      from '@/presentation/stores/ui.store'
import type {
  CreatePagoPayload, UpsertFichaPayload,
  TipoFoto, RegisterInsumosPayload, UpdateCitaInsumoPayload,
} from '@/shared/types/agenda.types'

export function useDetalle() {
  const store   = useDetalleStore()
  const uiStore = useUiStore()

  async function loadAll(idCita: string): Promise<void> {
    await store.loadAll(idCita)
  }

  async function savePago(payload: CreatePagoPayload): Promise<boolean> {
    try {
      await store.createPago(payload)
      uiStore.showToast('Pago registrado', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al registrar pago', 'error')
      return false
    }
  }

  async function deletePago(id: string): Promise<boolean> {
    try {
      await store.removePago(id)
      uiStore.showToast('Pago eliminado', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar pago', 'error')
      return false
    }
  }

  async function saveFicha(payload: UpsertFichaPayload): Promise<boolean> {
    try {
      await store.upsertFicha(payload)
      uiStore.showToast('Ficha técnica guardada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al guardar ficha', 'error')
      return false
    }
  }

  async function toggleItem(idCita: string, idItem: string, completado: boolean): Promise<void> {
    try {
      await store.toggleChecklistItem(idCita, idItem, completado)
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar checklist', 'error')
    }
  }

  async function uploadFoto(idCita: string, file: File, tipo: TipoFoto): Promise<boolean> {
    try {
      await store.uploadFoto(idCita, file, tipo)
      uiStore.showToast('Foto subida correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al subir foto', 'error')
      return false
    }
  }

  async function deleteFoto(id: string): Promise<boolean> {
    try {
      await store.removeFoto(id)
      uiStore.showToast('Foto eliminada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar foto', 'error')
      return false
    }
  }

  async function saveInsumos(payload: RegisterInsumosPayload): Promise<boolean> {
    try {
      await store.registerInsumos(payload)
      uiStore.showToast('Insumos registrados', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al registrar insumos', 'error')
      return false
    }
  }

  async function updateInsumo(id: string, payload: UpdateCitaInsumoPayload): Promise<boolean> {
    try {
      await store.updateCitaInsumo(id, payload)
      uiStore.showToast('Insumo actualizado', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar insumo', 'error')
      return false
    }
  }

  return {
    store,
    loadAll,
    savePago, deletePago,
    saveFicha,
    toggleItem,
    uploadFoto, deleteFoto,
    saveInsumos, updateInsumo,
  }
}
