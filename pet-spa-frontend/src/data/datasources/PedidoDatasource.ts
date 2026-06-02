import { API_BASE_URL, API_ENDPOINTS } from '@/core/config/api.config'
import { useAuthStore } from '@/presentation/stores/auth.store'
import type {
  Pedido, PedidoListResponse, PedidoDetalleResponse,
  CreatePedidoPayload, EstadoPedido,
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

export async function fetchMisPedidos(): Promise<Pedido[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.MIS_PEDIDOS}`, { headers: headers() })
  const data = await handleResponse<PedidoListResponse>(res)
  return data.pedidos
}

export async function fetchTodosPedidos(estado?: EstadoPedido): Promise<Pedido[]> {
  const qs = estado ? `?estado=${estado}` : ''
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.BASE}${qs}`, { headers: headers() })
  const data = await handleResponse<PedidoListResponse>(res)
  return data.pedidos
}

export async function fetchPedidoById(id: string): Promise<PedidoDetalleResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.BY_ID(id)}`, { headers: headers() })
  return handleResponse<PedidoDetalleResponse>(res)
}

export async function createPedido(payload: CreatePedidoPayload): Promise<PedidoDetalleResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.BASE}`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(payload),
  })
  return handleResponse<PedidoDetalleResponse>(res)
}

export async function cambiarEstadoPedido(
  id: string, estado: EstadoPedido,
  pago?: { metodo: 'efectivo' | 'qr' | 'transferencia'; referencia?: string },
): Promise<Pedido> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.ESTADO(id)}`, {
    method:  'PATCH',
    headers: headers(),
    body:    JSON.stringify({ estado, ...pago }),
  })
  const data = await handleResponse<{ pedido: Pedido }>(res)
  return data.pedido
}

export async function fetchWhatsappLink(id: string, tel?: string): Promise<string> {
  const qs = tel ? `?tel=${tel}` : ''
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.WHATSAPP(id)}${qs}`, { headers: headers() })
  const data = await handleResponse<{ link: string }>(res)
  return data.link
}
