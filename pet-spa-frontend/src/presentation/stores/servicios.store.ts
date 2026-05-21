import { defineStore } from 'pinia'
import { ref } from 'vue'
import { servicioDatasource } from '@/data/datasources/ServicioDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Servicio, CreateServicioPayload, UpdateServicioPayload } from '@/shared/types/agenda.types'

export const useServiciosStore = defineStore('servicios', () => {
  const servicios = ref<Servicio[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll(soloActivos = true): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res       = await servicioDatasource.list(soloActivos)
      servicios.value = res.servicios
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateServicioPayload): Promise<Servicio> {
    loading.value = true
    error.value   = null
    try {
      const res = await servicioDatasource.create(payload)
      servicios.value.push(res.servicio)
      return res.servicio
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateServicioPayload): Promise<Servicio> {
    loading.value = true
    error.value   = null
    try {
      const res = await servicioDatasource.update(id, payload)
      const idx = servicios.value.findIndex(s => s.id_servicio === id)
      if (idx !== -1) servicios.value[idx] = res.servicio
      return res.servicio
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError(): void { error.value = null }

  return { servicios, loading, error, fetchAll, create, update, clearError }
})
