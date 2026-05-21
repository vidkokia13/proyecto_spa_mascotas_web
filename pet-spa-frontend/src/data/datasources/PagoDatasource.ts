import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type { CreatePagoPayload, PagoListResponse, PagoResponse } from '@/shared/types/agenda.types'

export const pagoDatasource = {
  async listByCita(idCita: string): Promise<PagoListResponse> {
    const { data } = await http.get<PagoListResponse>(API_ENDPOINTS.PAGOS.BY_CITA(idCita))
    return data
  },

  async create(payload: CreatePagoPayload): Promise<PagoResponse> {
    const { data } = await http.post<PagoResponse>(API_ENDPOINTS.PAGOS.BASE, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.PAGOS.BY_ID(id))
  },
}
