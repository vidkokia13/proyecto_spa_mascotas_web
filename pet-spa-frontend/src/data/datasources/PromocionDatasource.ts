import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  CreatePromocionPayload, UpdatePromocionPayload,
  VerificarPromocionPayload, VerificarPromocionResponse,
  PromocionListResponse, PromocionResponse,
} from '@/shared/types/agenda.types'

export const promocionDatasource = {
  async list(soloActivas = false): Promise<PromocionListResponse> {
    const { data } = await http.get<PromocionListResponse>(API_ENDPOINTS.PROMOCIONES.BASE, {
      params: soloActivas ? { soloActivas: true } : {},
    })
    return data
  },

  async getOne(id: string): Promise<PromocionResponse> {
    const { data } = await http.get<PromocionResponse>(API_ENDPOINTS.PROMOCIONES.BY_ID(id))
    return data
  },

  async verificar(payload: VerificarPromocionPayload): Promise<VerificarPromocionResponse> {
    const { data } = await http.post<VerificarPromocionResponse>(API_ENDPOINTS.PROMOCIONES.VERIFICAR, payload)
    return data
  },

  async create(payload: CreatePromocionPayload): Promise<PromocionResponse> {
    const { data } = await http.post<PromocionResponse>(API_ENDPOINTS.PROMOCIONES.BASE, payload)
    return data
  },

  async update(id: string, payload: UpdatePromocionPayload): Promise<PromocionResponse> {
    const { data } = await http.patch<PromocionResponse>(API_ENDPOINTS.PROMOCIONES.BY_ID(id), payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.PROMOCIONES.BY_ID(id))
  },
}
