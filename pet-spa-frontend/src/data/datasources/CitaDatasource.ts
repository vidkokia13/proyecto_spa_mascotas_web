import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  CreateCitaPayload, UpdateCitaPayload, CambiarEstadoPayload, CancelarCitaPayload,
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

  async reprogramar(id: string, payload: import('@/shared/types/agenda.types').ReprogramarPayload): Promise<CitaResponse> {
    const { data } = await http.patch<CitaResponse>(API_ENDPOINTS.CITAS.REPROGRAMAR(id), payload)
    return data
  },

  async cancelar(id: string, payload: CancelarCitaPayload): Promise<CitaResponse> {
    const { data } = await http.patch<CitaResponse>(API_ENDPOINTS.CITAS.CANCELAR(id), payload)
    return data
  },

  async miAgenda(params?: { fechaInicio?: string; fechaFin?: string }): Promise<CitaListResponse> {
    const { data } = await http.get<CitaListResponse>(API_ENDPOINTS.CITAS.MI_AGENDA, { params })
    return data
  },

  async cerrar(id: string): Promise<CitaResponse> {
    const { data } = await http.post<CitaResponse>(API_ENDPOINTS.CITAS.CERRAR(id))
    return data
  },
}
