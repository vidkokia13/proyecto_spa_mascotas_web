import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  CreateServicioPayload, UpdateServicioPayload,
  ServicioListResponse, ServicioResponse,
} from '@/shared/types/agenda.types'

export const servicioDatasource = {
  async list(soloActivos = true): Promise<ServicioListResponse> {
    const { data } = await http.get<ServicioListResponse>(API_ENDPOINTS.SERVICIOS.BASE, {
      params: soloActivos ? {} : { todos: true },
    })
    return data
  },

  async getOne(id: string): Promise<ServicioResponse> {
    const { data } = await http.get<ServicioResponse>(API_ENDPOINTS.SERVICIOS.BY_ID(id))
    return data
  },

  async create(payload: CreateServicioPayload): Promise<ServicioResponse> {
    const { data } = await http.post<ServicioResponse>(API_ENDPOINTS.SERVICIOS.BASE, payload)
    return data
  },

  async update(id: string, payload: UpdateServicioPayload): Promise<ServicioResponse> {
    const { data } = await http.patch<ServicioResponse>(API_ENDPOINTS.SERVICIOS.BY_ID(id), payload)
    return data
  },
}
