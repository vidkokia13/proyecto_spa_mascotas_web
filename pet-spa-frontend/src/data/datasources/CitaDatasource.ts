import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  CreateCitaPayload, UpdateCitaPayload, CambiarEstadoPayload,
  CitaListResponse, CitaResponse, EstadoCita,
} from '@/shared/types/agenda.types'

export const citaDatasource = {
  async misCitas(params?: { limit?: number; offset?: number }): Promise<CitaListResponse> {
    const { data } = await http.get<CitaListResponse>(API_ENDPOINTS.CITAS.MIS_CITAS, { params })
    return data
  },

  async listRango(params: {
    fechaInicio: string
    fechaFin: string
    idTrabajador?: string
    estado?: EstadoCita
  }): Promise<CitaListResponse> {
    const { data } = await http.get<CitaListResponse>(API_ENDPOINTS.CITAS.BASE, { params })
    return data
  },

  async getOne(id: string): Promise<CitaResponse> {
    const { data } = await http.get<CitaResponse>(API_ENDPOINTS.CITAS.BY_ID(id))
    return data
  },

  async create(payload: CreateCitaPayload): Promise<CitaResponse> {
    const { data } = await http.post<CitaResponse>(API_ENDPOINTS.CITAS.BASE, payload)
    return data
  },

  async cambiarEstado(id: string, payload: CambiarEstadoPayload): Promise<CitaResponse> {
    const { data } = await http.patch<CitaResponse>(API_ENDPOINTS.CITAS.ESTADO(id), payload)
    return data
  },

  async update(id: string, payload: UpdateCitaPayload): Promise<CitaResponse> {
    const { data } = await http.patch<CitaResponse>(API_ENDPOINTS.CITAS.BY_ID(id), payload)
    return data
  },
}
