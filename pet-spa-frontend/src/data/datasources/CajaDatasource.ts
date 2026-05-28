import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  ResumenCajaResponse, CierreCajaResponse, HistorialCierresResponse,
} from '@/shared/types/agenda.types'

export const cajaDatasource = {
  async getResumen(fecha?: string): Promise<ResumenCajaResponse> {
    const { data } = await http.get<ResumenCajaResponse>(API_ENDPOINTS.CAJA.RESUMEN, {
      params: fecha ? { fecha } : {},
    })
    return data
  },

  async cerrar(payload: { fecha?: string; notas?: string }): Promise<CierreCajaResponse> {
    const { data } = await http.post<CierreCajaResponse>(API_ENDPOINTS.CAJA.CERRAR, payload)
    return data
  },

  async reabrir(payload: { fecha: string }): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(API_ENDPOINTS.CAJA.REABRIR, payload)
    return data
  },

  async historial(params?: { limit?: number; offset?: number }): Promise<HistorialCierresResponse> {
    const { data } = await http.get<HistorialCierresResponse>(API_ENDPOINTS.CAJA.HISTORIAL, { params })
    return data
  },
}
