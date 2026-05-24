import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cajaDatasource } from '@/data/datasources/CajaDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { ResumenCaja, CierreCaja } from '@/shared/types/agenda.types'

export const useCajaStore = defineStore('caja', () => {
  const resumen   = ref<ResumenCaja | null>(null)
  const historial = ref<CierreCaja[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchResumen(fecha?: string): Promise<void> {
    loading.value = true; error.value = null
    try { resumen.value = (await cajaDatasource.getResumen(fecha)).resumen }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function cerrar(payload: { fecha?: string; notas?: string }): Promise<CierreCaja> {
    loading.value = true; error.value = null
    try {
      const cierre = (await cajaDatasource.cerrar(payload)).cierre
      if (resumen.value) resumen.value = { ...resumen.value, ya_cerrada: true, cierre }
      historial.value.unshift(cierre)
      return cierre
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function fetchHistorial(params?: { limit?: number; offset?: number }): Promise<void> {
    loading.value = true; error.value = null
    try { historial.value = (await cajaDatasource.historial(params)).cierres }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  function clearError(): void { error.value = null }

  return { resumen, historial, loading, error, fetchResumen, cerrar, fetchHistorial, clearError }
})
