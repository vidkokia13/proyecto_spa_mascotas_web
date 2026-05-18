import { useLogsStore } from '@/presentation/stores/logs.store'

export function useLogs() {
  const store = useLogsStore()

  async function loadLogs(params?: { page?: number; limit?: number }): Promise<void> {
    await store.fetchLogs(params)
  }

  return { store, loadLogs }
}
