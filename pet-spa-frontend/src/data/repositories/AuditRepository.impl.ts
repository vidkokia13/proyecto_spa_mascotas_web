import { auditDatasource } from '@/data/datasources/AuditDatasource'
import type { IAuditRepository, AuditLogListResponse } from '@/domain/repositories/AuditRepository.interface'

export class AuditRepositoryImpl implements IAuditRepository {
  getLogs(params?: { page?: number; limit?: number }): Promise<AuditLogListResponse> {
    return auditDatasource.getLogs(params)
  }
}

export const auditRepository = new AuditRepositoryImpl()
