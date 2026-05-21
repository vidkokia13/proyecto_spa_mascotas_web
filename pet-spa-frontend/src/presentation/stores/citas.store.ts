import { defineStore } from 'pinia'
import { ref } from 'vue'
import { citaDatasource } from '@/data/datasources/CitaDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Cita, CreateCitaPayload, UpdateCitaPayload, EstadoCita } from '@/shared/types/agenda.types'

export const useCitasStore = defineStore('citas', () => {
  const citas    = ref<Cita[]>([])
  const selected = ref<Cita | null>(null)
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchMisCitas(params?: { limit?: number; offset?: number }): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res  = await citaDatasource.misCitas(params)
      citas.value = res.citas
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchRango(params: {
    fechaInicio: string
    fechaFin: string
    idTrabajador?: string
    estado?: EstadoCita
  }): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res   = await citaDatasource.listRango(params)
      citas.value = res.citas
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await citaDatasource.getOne(id)
      selected.value = res.cita
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateCitaPayload): Promise<Cita> {
    loading.value = true
    error.value   = null
    try {
      const res = await citaDatasource.create(payload)
      citas.value.unshift(res.cita)
      return res.cita
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cambiarEstado(id: string, estado: EstadoCita): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await citaDatasource.cambiarEstado(id, { estado })
      const idx = citas.value.findIndex(c => c.id_cita === id)
      if (idx !== -1) citas.value[idx] = res.cita
      if (selected.value?.id_cita === id) selected.value = res.cita
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateCitaPayload): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await citaDatasource.update(id, payload)
      const idx = citas.value.findIndex(c => c.id_cita === id)
      if (idx !== -1) citas.value[idx] = res.cita
      if (selected.value?.id_cita === id) selected.value = res.cita
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError(): void { error.value = null }
  function clearSelected(): void { selected.value = null }

  return {
    citas, selected, loading, error,
    fetchMisCitas, fetchRango, fetchOne, create, cambiarEstado, update,
    clearError, clearSelected,
  }
})
