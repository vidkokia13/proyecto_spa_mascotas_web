import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mascotaDatasource } from '@/data/datasources/MascotaDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Mascota, CreateMascotaPayload, UpdateMascotaPayload } from '@/shared/types/agenda.types'

export const useMascotasStore = defineStore('mascotas', () => {
  const mascotas = ref<Mascota[]>([])
  const selected = ref<Mascota | null>(null)
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll(idUsuario?: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await mascotaDatasource.list(idUsuario)
      mascotas.value = res.mascotas
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
      const res      = await mascotaDatasource.getOne(id)
      selected.value = res.mascota
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateMascotaPayload): Promise<Mascota> {
    loading.value = true
    error.value   = null
    try {
      const res = await mascotaDatasource.create(payload)
      mascotas.value.unshift(res.mascota)
      return res.mascota
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateMascotaPayload): Promise<Mascota> {
    loading.value = true
    error.value   = null
    try {
      const res = await mascotaDatasource.update(id, payload)
      const idx = mascotas.value.findIndex(m => m.id_mascota === id)
      if (idx !== -1) mascotas.value[idx] = res.mascota
      if (selected.value?.id_mascota === id) selected.value = res.mascota
      return res.mascota
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      await mascotaDatasource.remove(id)
      mascotas.value = mascotas.value.filter(m => m.id_mascota !== id)
      if (selected.value?.id_mascota === id) selected.value = null
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
    mascotas, selected, loading, error,
    fetchAll, fetchOne, create, update, remove, clearError, clearSelected,
  }
})
