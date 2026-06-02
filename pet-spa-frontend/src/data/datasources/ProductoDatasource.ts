import { API_BASE_URL, API_ENDPOINTS } from '@/core/config/api.config'
import { useAuthStore } from '@/presentation/stores/auth.store'
import type {
  Producto, ProductoListResponse, ProductoResponse,
  CreateProductoPayload, UpdateProductoPayload,
} from '@/shared/types/agenda.types'

function headers(): Record<string, string> {
  const token = useAuthStore().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Error en la solicitud')
  return data as T
}

export async function fetchProductos(params?: { categoria?: string; buscar?: string }): Promise<Producto[]> {
  const qs = new URLSearchParams()
  if (params?.categoria) qs.set('categoria', params.categoria)
  if (params?.buscar)    qs.set('buscar', params.buscar)
  const url = `${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.BASE}${qs.toString() ? '?' + qs : ''}`
  const res = await fetch(url, { headers: headers() })
  const data = await handleResponse<ProductoListResponse>(res)
  return data.productos
}

export async function fetchProductoById(id: string): Promise<Producto> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.BY_ID(id)}`, { headers: headers() })
  const data = await handleResponse<ProductoResponse>(res)
  return data.producto
}

export async function createProducto(payload: CreateProductoPayload, imagen?: File): Promise<Producto> {
  const form = new FormData()
  Object.entries(payload).forEach(([k, v]) => { if (v != null) form.append(k, String(v)) })
  if (imagen) form.append('imagen', imagen)
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.BASE}`, {
    method:  'POST',
    headers: headers(),
    body:    form,
  })
  const data = await handleResponse<ProductoResponse>(res)
  return data.producto
}

export async function updateProducto(id: string, payload: UpdateProductoPayload, imagen?: File): Promise<Producto> {
  const form = new FormData()
  Object.entries(payload).forEach(([k, v]) => { if (v != null) form.append(k, String(v)) })
  if (imagen) form.append('imagen', imagen)
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.BY_ID(id)}`, {
    method:  'PATCH',
    headers: headers(),
    body:    form,
  })
  const data = await handleResponse<ProductoResponse>(res)
  return data.producto
}

export async function deleteProductoImagen(id: string): Promise<Producto> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.IMAGEN(id)}`, {
    method:  'DELETE',
    headers: headers(),
  })
  const data = await handleResponse<ProductoResponse>(res)
  return data.producto
}

export async function deleteProducto(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTOS.BY_ID(id)}`, {
    method:  'DELETE',
    headers: headers(),
  })
  await handleResponse<{ message: string }>(res)
}
