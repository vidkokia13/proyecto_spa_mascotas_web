import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auditRepository } from '@/data/repositories/AuditRepository.impl'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { AuditLogEntity } from '@/domain/entities/AuditLog.entity'

export const useLogsStore = defineStore('logs', () => {
  const logs        = ref<AuditLogEntity[]>([])
  const loading     = ref(false)
  const error       = ref<string | null>(null)
  const unavailable = ref(false)

  async function fetchLogs(params?: { page?: number; limit?: number }): Promise<void> {
    loading.value     = true
    error.value       = null
    unavailable.value = false
    try {
      const res  = await auditRepository.getLogs(params)
      logs.value = res.logs
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 501) {
        unavailable.value = true
        logs.value = []
      } else {
        error.value = extractErrorMessage(e)
      }
    } finally {
      loading.value = false
    }
  }

  return { logs, loading, error, unavailable, fetchLogs }
})
