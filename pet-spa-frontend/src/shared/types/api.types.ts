export interface ApiError {
  message: string
  code?: string
}

export interface ApiErrorResponse {
  error: ApiError
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
