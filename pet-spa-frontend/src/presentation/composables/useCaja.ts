import { useCajaStore } from '@/presentation/stores/caja.store'
import { useUiStore } from '@/presentation/stores/ui.store'

export function useCaja() {
  const store   = useCajaStore()
  const uiStore = useUiStore()

  async function loadResumen(fecha?: string): Promise<void> {
    await store.fetchResumen(fecha)
  }

  async function cerrarCaja(payload: { fecha?: string; notas?: string }): Promise<boolean> {
    try {
      await store.cerrar(payload)
      uiStore.showToast('Caja cerrada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al cerrar caja', 'error')
      return false
    }
  }

  async function loadHistorial(params?: { limit?: number; offset?: number }): Promise<void> {
    await store.fetchHistorial(params)
  }

  return { store, loadResumen, cerrarCaja, loadHistorial }
}
