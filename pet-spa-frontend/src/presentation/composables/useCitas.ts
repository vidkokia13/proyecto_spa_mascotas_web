import { useCitasStore } from '@/presentation/stores/citas.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { CreateCitaPayload, UpdateCitaPayload, EstadoCita } from '@/shared/types/agenda.types'

export function useCitas() {
  const store   = useCitasStore()
  const uiStore = useUiStore()

  async function loadMisCitas(params?: { limit?: number; offset?: number }): Promise<void> {
    await store.fetchMisCitas(params)
  }

  async function loadRango(params: {
    fechaInicio: string
    fechaFin: string
    idTrabajador?: string
    estado?: EstadoCita
  }): Promise<void> {
    await store.fetchRango(params)
  }

  async function createCita(payload: CreateCitaPayload): Promise<boolean> {
    try {
      await store.create(payload)
      uiStore.showToast('Cita agendada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al agendar cita', 'error')
      return false
    }
  }

  async function cambiarEstado(id: string, estado: EstadoCita): Promise<boolean> {
    try {
      await store.cambiarEstado(id, estado)
      uiStore.showToast('Estado actualizado', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al cambiar estado', 'error')
      return false
    }
  }

  async function updateCita(id: string, payload: UpdateCitaPayload): Promise<boolean> {
    try {
      await store.update(id, payload)
      uiStore.showToast('Cita actualizada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar cita', 'error')
      return false
    }
  }

  async function reprogramarCita(id: string, fechaHoraInicio: string): Promise<boolean> {
    try {
      await store.reprogramar(id, fechaHoraInicio)
      uiStore.showToast('Cita reprogramada correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al reprogramar la cita', 'error')
      return false
    }
  }

  return { store, loadMisCitas, loadRango, createCita, cambiarEstado, updateCita, reprogramarCita }
}
