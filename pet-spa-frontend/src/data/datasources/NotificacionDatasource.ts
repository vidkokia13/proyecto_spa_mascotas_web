import { API_BASE_URL, API_ENDPOINTS } from '@/core/config/api.config'
import { useAuthStore } from '@/presentation/stores/auth.store'
import type {
  NotifListResponse,
  NotifStatsResponse,
  TipoNotificacion,
} from '@/shared/types/agenda.types'

function headers(): Record<string, string> {
  const token = useAuthStore().token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Error en la solicitud')
  return data as T
}

export async function fetchNotificaciones(params: {
  tipo?:   TipoNotificacion | ''
  fecha?:  string
  limit?:  number
  offset?: number
}): Promise<NotifListResponse> {
  const qs = new URLSearchParams()
  if (params.tipo)            qs.set('tipo',   params.tipo)
  if (params.fecha)           qs.set('fecha',  params.fecha)
  if (params.limit  != null)  qs.set('limit',  String(params.limit))
  if (params.offset != null)  qs.set('offset', String(params.offset))

  const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICACIONES.BASE}?${qs}`
  const res  = await fetch(url, { headers: headers() })
  return handleResponse<NotifListResponse>(res)
}

export async function fetchStats(fecha?: string): Promise<NotifStatsResponse> {
  const qs  = fecha ? `?fecha=${fecha}` : ''
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICACIONES.STATS}${qs}`, { headers: headers() })
  return handleResponse<NotifStatsResponse>(res)
}

export async function checkStock(): Promise<{
  ok: boolean
  verificados: number
  enviados: number
  mensaje?: string
  productos?: { nombre: string; stock: number; minimo: number }[]
  error?: string
}> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICACIONES.CHECK_STOCK}`, {
    method:  'POST',
    headers: headers(),
  })
  return handleResponse(res)
}

export async function probarEnvio(): Promise<{
  ok: boolean
  resultado: {
    smtp: { ok: boolean; error: string | null; messageId: string | null }
    db:   { ok: boolean; error: string | null; tablaExiste: boolean }
  }
}> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICACIONES.TEST}`, {
    method:  'POST',
    headers: headers(),
  })
  return handleResponse(res)
}
