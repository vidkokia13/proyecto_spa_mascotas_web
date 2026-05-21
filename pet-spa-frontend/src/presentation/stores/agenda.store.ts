import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agendaDatasource } from '@/data/datasources/AgendaDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type {
  Horario, SetHorarioPayload,
  Bloqueo, CreateBloqueoPayload,
  Disponibilidad, SetDisponibilidadPayload,
  Slot, SlotsResponse,
} from '@/shared/types/agenda.types'

export const useAgendaStore = defineStore('agenda', () => {
  const horarios       = ref<Horario[]>([])
  const bloqueos       = ref<Bloqueo[]>([])
  const disponibilidad = ref<Disponibilidad[]>([])
  const slots          = ref<Slot[]>([])
  const slotsInfo      = ref<Omit<SlotsResponse, 'slots'> | null>(null)
  const loading        = ref(false)
  const error          = ref<string | null>(null)

  // ── Horarios ────────────────────────────────────────────────────────────────
  async function fetchHorarios(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await agendaDatasource.getHorarios()
      horarios.value = res.horarios
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setHorario(payload: SetHorarioPayload): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await agendaDatasource.setHorario(payload)
      const idx = horarios.value.findIndex(h => h.dia_semana === payload.diaSemana)
      if (idx !== -1) horarios.value[idx] = res.horario
      else horarios.value.push(res.horario)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function toggleHorario(dia: number, activo: boolean): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await agendaDatasource.toggleHorario(dia, activo)
      const idx = horarios.value.findIndex(h => h.dia_semana === dia)
      if (idx !== -1) horarios.value[idx] = res.horario
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Disponibilidad ──────────────────────────────────────────────────────────
  async function fetchDisponibilidad(idTrabajador: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res            = await agendaDatasource.getDisponibilidadGroomer(idTrabajador)
      disponibilidad.value = res.disponibilidad
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setDisponibilidad(payload: SetDisponibilidadPayload): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await agendaDatasource.setDisponibilidad(payload)
      const idx = disponibilidad.value.findIndex(
        d => d.id_trabajador === payload.idTrabajador && d.dia_semana === payload.diaSemana,
      )
      if (idx !== -1) disponibilidad.value[idx] = res.disponibilidad
      else disponibilidad.value.push(res.disponibilidad)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeDisponibilidad(idTrabajador: string, dia: number): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      await agendaDatasource.removeDisponibilidad(idTrabajador, dia)
      disponibilidad.value = disponibilidad.value.filter(
        d => !(d.id_trabajador === idTrabajador && d.dia_semana === dia),
      )
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Bloqueos ─────────────────────────────────────────────────────────────────
  async function fetchBloqueos(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await agendaDatasource.getBloqueos()
      bloqueos.value = res.bloqueos
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createBloqueo(payload: CreateBloqueoPayload): Promise<Bloqueo> {
    loading.value = true
    error.value   = null
    try {
      const res = await agendaDatasource.createBloqueo(payload)
      bloqueos.value.unshift(res.bloqueo)
      return res.bloqueo
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteBloqueo(id: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      await agendaDatasource.deleteBloqueo(id)
      bloqueos.value = bloqueos.value.filter(b => b.id_bloqueo !== id)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Slots ─────────────────────────────────────────────────────────────────────
  async function fetchSlots(params: {
    fecha: string
    idServicio: string
    idMascota: string
    idTrabajador?: string
  }): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await agendaDatasource.getSlots(params)
      slots.value    = res.slots
      slotsInfo.value = { fecha: res.fecha, dia_semana: res.dia_semana, duracion_ajustada: res.duracion_ajustada }
    } catch (e) {
      error.value = extractErrorMessage(e)
      slots.value = []
      slotsInfo.value = null
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearSlots(): void { slots.value = []; slotsInfo.value = null }
  function clearError(): void { error.value = null }

  return {
    horarios, bloqueos, disponibilidad, slots, slotsInfo, loading, error,
    fetchHorarios, setHorario, toggleHorario,
    fetchDisponibilidad, setDisponibilidad, removeDisponibilidad,
    fetchBloqueos, createBloqueo, deleteBloqueo,
    fetchSlots, clearSlots, clearError,
  }
})
