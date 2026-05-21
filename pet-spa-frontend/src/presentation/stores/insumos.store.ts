import { defineStore } from 'pinia'
import { ref } from 'vue'
import { insumoDatasource }    from '@/data/datasources/InsumoDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Insumo, CreateInsumoPayload, UpdateInsumoPayload } from '@/shared/types/agenda.types'

export const useInsumosStore = defineStore('insumos', () => {
  const insumos = ref<Insumo[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true; error.value = null
    try { insumos.value = (await insumoDatasource.list()).insumos }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function create(payload: CreateInsumoPayload): Promise<Insumo> {
    loading.value = true; error.value = null
    try {
      const res = await insumoDatasource.create(payload)
      insumos.value.push(res.insumo)
      return res.insumo
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function update(id: string, payload: UpdateInsumoPayload): Promise<void> {
    loading.value = true; error.value = null
    try {
      const res = await insumoDatasource.update(id, payload)
      const idx = insumos.value.findIndex(i => i.id_insumo === id)
      if (idx !== -1) insumos.value[idx] = res.insumo
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  function clearError(): void { error.value = null }

  return { insumos, loading, error, fetchAll, create, update, clearError }
})
