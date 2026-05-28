import { defineStore } from 'pinia'
import { ref } from 'vue'
import { insumoDatasource }    from '@/data/datasources/InsumoDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Insumo, CreateInsumoPayload, UpdateInsumoPayload, InsumoLog, InsumoPrediccion } from '@/shared/types/agenda.types'

export const useInsumosStore = defineStore('insumos', () => {
  const insumos       = ref<Insumo[]>([])
  const alertas       = ref<Insumo[]>([])
  const logRegistros  = ref<InsumoLog[]>([])
  const predicciones  = ref<InsumoPrediccion[]>([])
  const loading       = ref(false)
  const error         = ref<string | null>(null)

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

  async function fetchAlertas(): Promise<void> {
    try { alertas.value = (await insumoDatasource.alertas()).insumos }
    catch { /* no-op: alertas are informational */ }
  }

  async function fetchLog(params?: { idTrabajador?: string; fecha?: string }): Promise<void> {
    try { logRegistros.value = (await insumoDatasource.log(params)).registros }
    catch { /* no-op */ }
  }

  async function fetchPrediccion(): Promise<void> {
    try { predicciones.value = (await insumoDatasource.prediccion()).alertas }
    catch { /* no-op */ }
  }

  function clearError(): void { error.value = null }

  return { insumos, alertas, logRegistros, predicciones, loading, error, fetchAll, fetchAlertas, fetchLog, fetchPrediccion, create, update, clearError }
})
