import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  ChecklistItemsResponse, CitaChecklistResponse,
  CreateChecklistItemPayload, UpdateChecklistItemPayload,
  ChecklistItem,
} from '@/shared/types/agenda.types'

export const checklistDatasource = {
  async getItems(): Promise<ChecklistItemsResponse> {
    const { data } = await http.get<ChecklistItemsResponse>(API_ENDPOINTS.CHECKLIST.ITEMS)
    return data
  },

  async createItem(payload: CreateChecklistItemPayload): Promise<{ item: ChecklistItem }> {
    const { data } = await http.post<{ item: ChecklistItem }>(API_ENDPOINTS.CHECKLIST.ITEMS, payload)
    return data
  },

  async updateItem(id: string, payload: UpdateChecklistItemPayload): Promise<{ item: ChecklistItem }> {
    const { data } = await http.patch<{ item: ChecklistItem }>(API_ENDPOINTS.CHECKLIST.ITEM_BY_ID(id), payload)
    return data
  },

  async getByCita(idCita: string): Promise<CitaChecklistResponse> {
    const { data } = await http.get<CitaChecklistResponse>(API_ENDPOINTS.CHECKLIST.BY_CITA(idCita))
    return data
  },

  async toggleItem(idCita: string, idItem: string, completado: boolean): Promise<CitaChecklistResponse> {
    const { data } = await http.patch<CitaChecklistResponse>(
      API_ENDPOINTS.CHECKLIST.TOGGLE(idCita, idItem),
      { completado },
    )
    return data
  },
}
