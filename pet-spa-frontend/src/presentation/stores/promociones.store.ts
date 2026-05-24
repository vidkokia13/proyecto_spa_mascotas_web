import { defineStore } from 'pinia'
import { ref } from 'vue'
import { promocionDatasource } from '@/data/datasources/PromocionDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type {
  Promocion, CreatePromocionPayload, UpdatePromocionPayload,
  VerificarPromocionPayload, VerificarPromocionResponse,
} from '@/shared/types/agenda.types'

export const usePromocionesStore = defineStore('promociones', () => {
  const promociones  = ref<Promocion[]>([])
  const loading      = ref(false)
  const error        = ref<string | null>(null)
  const verificacion = ref<VerificarPromocionResponse | null>(null)

  async function fetchAll(soloActivas = false): Promise<void> {
    loading.value = true; error.value = null
    try { promociones.value = (await promocionDatasource.list(soloActivas)).promociones }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function verificar(payload: VerificarPromocionPayload): Promise<VerificarPromocionResponse> {
    loading.value = true; error.value = null
    try {
      const res = await promocionDatasource.verificar(payload)
      verificacion.value = res
      return res
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  function clearVerificacion(): void {
    verificacion.value = null
  }

  async function create(payload: CreatePromocionPayload): Promise<Promocion> {
    loading.value = true; error.value = null
    try {
      const res = await promocionDatasource.create(payload)
      promociones.value.unshift(res.promocion)
      return res.promocion
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function update(id: string, payload: UpdatePromocionPayload): Promise<Promocion> {
    loading.value = true; error.value = null
    try {
      const res = await promocionDatasource.update(id, payload)
      const idx = promociones.value.findIndex(p => p.id_promocion === id)
      if (idx !== -1) promociones.value[idx] = res.promocion
      return res.promocion
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function remove(id: string): Promise<void> {
    loading.value = true; error.value = null
    try {
      await promocionDatasource.remove(id)
      const idx = promociones.value.findIndex(p => p.id_promocion === id)
      if (idx !== -1) promociones.value[idx] = { ...promociones.value[idx], activo: false }
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  function clearError(): void { error.value = null }

  return { promociones, loading, error, verificacion, fetchAll, verificar, clearVerificacion, create, update, remove, clearError }
})
