import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  CreateMascotaPayload, UpdateMascotaPayload,
  MascotaListResponse, MascotaResponse,
} from '@/shared/types/agenda.types'

export const mascotaDatasource = {
  async list(idUsuario?: string): Promise<MascotaListResponse> {
    const params = idUsuario ? { idUsuario } : {}
    const { data } = await http.get<MascotaListResponse>(API_ENDPOINTS.MASCOTAS.BASE, { params })
    return data
  },

  async getOne(id: string): Promise<MascotaResponse> {
    const { data } = await http.get<MascotaResponse>(API_ENDPOINTS.MASCOTAS.BY_ID(id))
    return data
  },

  async create(payload: CreateMascotaPayload): Promise<MascotaResponse> {
    const { data } = await http.post<MascotaResponse>(API_ENDPOINTS.MASCOTAS.BASE, payload)
    return data
  },

  async update(id: string, payload: UpdateMascotaPayload): Promise<MascotaResponse> {
    const { data } = await http.patch<MascotaResponse>(API_ENDPOINTS.MASCOTAS.BY_ID(id), payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.MASCOTAS.BY_ID(id))
  },
}
