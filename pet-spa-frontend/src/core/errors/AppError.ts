export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message

  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>
    if (e.response && typeof e.response === 'object') {
      const res = e.response as Record<string, unknown>
      if (res.data && typeof res.data === 'object') {
        const data = res.data as Record<string, unknown>
        if (data.error && typeof data.error === 'object') {
          const apiError = data.error as Record<string, unknown>
          if (typeof apiError.message === 'string') return apiError.message
        }
        if (typeof data.message === 'string') return data.message
      }
    }
    if (typeof e.message === 'string') return e.message
  }

  if (typeof error === 'string') return error
  return 'Error inesperado. Intente nuevamente.'
}
