import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type { AuditLogListResponse } from '@/domain/repositories/AuditRepository.interface'

export const auditDatasource = {
  async getLogs(params?: { page?: number; limit?: number }): Promise<AuditLogListResponse> {
    const { data } = await http.get<AuditLogListResponse>(API_ENDPOINTS.AUDIT.LOGS, { params })
    return data
  },
}
