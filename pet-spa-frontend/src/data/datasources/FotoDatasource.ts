import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type { FotoListResponse, FotoResponse, TipoFoto } from '@/shared/types/agenda.types'

export const fotoDatasource = {
  async listByCita(idCita: string): Promise<FotoListResponse> {
    const { data } = await http.get<FotoListResponse>(API_ENDPOINTS.FOTOS.BY_CITA(idCita))
    return data
  },

  async upload(idCita: string, file: File, tipo: TipoFoto): Promise<FotoResponse> {
    const form = new FormData()
    form.append('foto', file)
    form.append('tipo', tipo)
    const { data } = await http.post<FotoResponse>(API_ENDPOINTS.FOTOS.BY_CITA(idCita), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.FOTOS.BY_ID(id))
  },
}
