import { useAgendaStore } from '@/presentation/stores/agenda.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import type { SetHorarioPayload, CreateBloqueoPayload, SetDisponibilidadPayload } from '@/shared/types/agenda.types'

export function useAgenda() {
  const store   = useAgendaStore()
  const uiStore = useUiStore()

  async function loadHorarios(): Promise<void> {
    await store.fetchHorarios()
  }

  async function saveHorario(payload: SetHorarioPayload): Promise<boolean> {
    try {
      await store.setHorario(payload)
      uiStore.showToast('Horario guardado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al guardar horario', 'error')
      return false
    }
  }

  async function toggleHorario(dia: number, activo: boolean): Promise<void> {
    try {
      await store.toggleHorario(dia, activo)
      uiStore.showToast(activo ? 'Día activado' : 'Día desactivado', 'success')
    } catch {
      uiStore.showToast(store.error ?? 'Error al actualizar horario', 'error')
    }
  }

  async function loadBloqueos(): Promise<void> {
    await store.fetchBloqueos()
  }

  async function createBloqueo(payload: CreateBloqueoPayload): Promise<boolean> {
    try {
      await store.createBloqueo(payload)
      uiStore.showToast('Bloqueo creado correctamente', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al crear bloqueo', 'error')
      return false
    }
  }

  async function deleteBloqueo(id: string): Promise<boolean> {
    try {
      await store.deleteBloqueo(id)
      uiStore.showToast('Bloqueo eliminado', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar bloqueo', 'error')
      return false
    }
  }

  async function loadDisponibilidad(idTrabajador: string): Promise<void> {
    await store.fetchDisponibilidad(idTrabajador)
  }

  async function saveDisponibilidad(payload: SetDisponibilidadPayload): Promise<boolean> {
    try {
      await store.setDisponibilidad(payload)
      uiStore.showToast('Disponibilidad guardada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al guardar disponibilidad', 'error')
      return false
    }
  }

  async function removeDisponibilidad(idTrabajador: string, dia: number): Promise<boolean> {
    try {
      await store.removeDisponibilidad(idTrabajador, dia)
      uiStore.showToast('Disponibilidad eliminada', 'success')
      return true
    } catch {
      uiStore.showToast(store.error ?? 'Error al eliminar disponibilidad', 'error')
      return false
    }
  }

  async function loadSlots(params: {
    fecha: string
    idServicio: string
    idMascota: string
    idTrabajador?: string
  }): Promise<boolean> {
    try {
      await store.fetchSlots(params)
      return true
    } catch {
      uiStore.showToast(store.error ?? 'No hay slots disponibles para esa fecha', 'error')
      return false
    }
  }

  return {
    store,
    loadHorarios, saveHorario, toggleHorario,
    loadBloqueos, createBloqueo, deleteBloqueo,
    loadDisponibilidad, saveDisponibilidad, removeDisponibilidad,
    loadSlots,
  }
}
