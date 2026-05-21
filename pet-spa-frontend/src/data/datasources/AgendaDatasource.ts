import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  HorarioListResponse, HorarioResponse, SetHorarioPayload,
  BloqueoListResponse, BloqueoResponse, CreateBloqueoPayload,
  SlotsResponse, SetDisponibilidadPayload, Disponibilidad,
} from '@/shared/types/agenda.types'

export const agendaDatasource = {
  // ── Horarios ────────────────────────────────────────────────────────────────
  async getHorarios(): Promise<HorarioListResponse> {
    const { data } = await http.get<HorarioListResponse>(API_ENDPOINTS.HORARIOS.BASE)
    return data
  },

  async setHorario(payload: SetHorarioPayload): Promise<HorarioResponse> {
    const { data } = await http.post<HorarioResponse>(API_ENDPOINTS.HORARIOS.BASE, payload)
    return data
  },

  async toggleHorario(dia: number, activo: boolean): Promise<HorarioResponse> {
    const { data } = await http.patch<HorarioResponse>(API_ENDPOINTS.HORARIOS.TOGGLE(dia), { activo })
    return data
  },

  // ── Disponibilidad ──────────────────────────────────────────────────────────
  async getDisponibilidadGroomer(idTrabajador: string): Promise<{ disponibilidad: Disponibilidad[] }> {
    const { data } = await http.get<{ disponibilidad: Disponibilidad[] }>(
      API_ENDPOINTS.HORARIOS.GROOMER_BY_ID(idTrabajador),
    )
    return data
  },

  async setDisponibilidad(payload: SetDisponibilidadPayload): Promise<{ disponibilidad: Disponibilidad }> {
    const { data } = await http.post<{ disponibilidad: Disponibilidad }>(
      API_ENDPOINTS.HORARIOS.GROOMERS, payload,
    )
    return data
  },

  async removeDisponibilidad(idTrabajador: string, dia: number): Promise<void> {
    await http.delete(API_ENDPOINTS.HORARIOS.GROOMER_REMOVE_DIA(idTrabajador, dia))
  },

  // ── Bloqueos ─────────────────────────────────────────────────────────────────
  async getBloqueos(): Promise<BloqueoListResponse> {
    const { data } = await http.get<BloqueoListResponse>(API_ENDPOINTS.AGENDA.BLOQUEOS)
    return data
  },

  async createBloqueo(payload: CreateBloqueoPayload): Promise<BloqueoResponse> {
    const { data } = await http.post<BloqueoResponse>(API_ENDPOINTS.AGENDA.BLOQUEOS, payload)
    return data
  },

  async deleteBloqueo(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.AGENDA.BLOQUEO_ID(id))
  },

  // ── Slots ─────────────────────────────────────────────────────────────────────
  async getSlots(params: {
    fecha: string
    idServicio: string
    idMascota: string
    idTrabajador?: string
  }): Promise<SlotsResponse> {
    const { data } = await http.get<SlotsResponse>(API_ENDPOINTS.AGENDA.SLOTS, { params })
    return data
  },
}
