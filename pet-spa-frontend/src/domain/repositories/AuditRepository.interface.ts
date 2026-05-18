import type { AuditLogEntity } from '@/domain/entities/AuditLog.entity'

export interface AuditLogListResponse {
  logs: AuditLogEntity[]
  total?: number
}

export interface IAuditRepository {
  getLogs(params?: { page?: number; limit?: number }): Promise<AuditLogListResponse>
}
