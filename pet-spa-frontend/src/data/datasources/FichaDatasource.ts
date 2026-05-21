import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type { UpsertFichaPayload, FichaResponse } from '@/shared/types/agenda.types'

export const fichaDatasource = {
  async getByCita(idCita: string): Promise<FichaResponse> {
    const { data } = await http.get<FichaResponse>(API_ENDPOINTS.FICHAS.BY_CITA(idCita))
    return data
  },

  async upsert(payload: UpsertFichaPayload): Promise<FichaResponse> {
    const { data } = await http.post<FichaResponse>(API_ENDPOINTS.FICHAS.BASE, payload)
    return data
  },
}
