import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  InsumoListResponse, CitaInsumoListResponse, AlertasInsumoResponse,
  CreateInsumoPayload, UpdateInsumoPayload,
  RegisterInsumosPayload, UpdateCitaInsumoPayload,
  Insumo, CitaInsumo, InsumoLogResponse, InsumoPrediccionResponse,
} from '@/shared/types/agenda.types'

export const insumoDatasource = {
  async list(): Promise<InsumoListResponse> {
    const { data } = await http.get<InsumoListResponse>(API_ENDPOINTS.INSUMOS.BASE)
    return data
  },

  async alertas(): Promise<AlertasInsumoResponse> {
    const { data } = await http.get<AlertasInsumoResponse>(API_ENDPOINTS.INSUMOS.ALERTAS)
    return data
  },

  async create(payload: CreateInsumoPayload): Promise<{ insumo: Insumo }> {
    const { data } = await http.post<{ insumo: Insumo }>(API_ENDPOINTS.INSUMOS.BASE, payload)
    return data
  },

  async update(id: string, payload: UpdateInsumoPayload): Promise<{ insumo: Insumo }> {
    const { data } = await http.patch<{ insumo: Insumo }>(API_ENDPOINTS.INSUMOS.BY_ID(id), payload)
    return data
  },

  async listByCita(idCita: string): Promise<CitaInsumoListResponse> {
    const { data } = await http.get<CitaInsumoListResponse>(API_ENDPOINTS.INSUMOS.CITA_INSUMOS(idCita))
    return data
  },

  async registerForCita(payload: RegisterInsumosPayload): Promise<{ insumos: CitaInsumo[] }> {
    const { data } = await http.post<{ insumos: CitaInsumo[] }>(API_ENDPOINTS.INSUMOS.CITA_REGISTER, payload)
    return data
  },

  async updateCitaInsumo(id: string, payload: UpdateCitaInsumoPayload): Promise<{ insumo: CitaInsumo }> {
    const { data } = await http.patch<{ insumo: CitaInsumo }>(API_ENDPOINTS.INSUMOS.CITA_INSUMO_UPDATE(id), payload)
    return data
  },

  async log(params?: { idTrabajador?: string; fecha?: string }): Promise<InsumoLogResponse> {
    const { data } = await http.get<InsumoLogResponse>(API_ENDPOINTS.INSUMOS.LOG, { params })
    return data
  },

  async prediccion(): Promise<InsumoPrediccionResponse> {
    const { data } = await http.get<InsumoPrediccionResponse>(API_ENDPOINTS.INSUMOS.PREDICCION)
    return data
  },
}
