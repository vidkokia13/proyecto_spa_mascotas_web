import { API_BASE_URL, API_ENDPOINTS } from '@/core/config/api.config'
import { useAuthStore } from '@/presentation/stores/auth.store'
import type {
  VentasReporte, OcupacionReporte, NpsReporte,
  CitaCronograma, CancelacionItem,
  ProductividadGroomer, InsumoGroomer,
  HistorialCita, PromocionUsada, PromocionDisponible,
} from '@/shared/types/agenda.types'

function headers(): Record<string, string> {
  const token = useAuthStore().token
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Error en la solicitud')
  return data as T
}

function qs(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v)
  return q.toString() ? `?${q}` : ''
}

const R = API_ENDPOINTS.REPORTES

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchVentas(p: { fecha_inicio?: string; fecha_fin?: string }): Promise<VentasReporte> {
  return handle(await fetch(`${API_BASE_URL}${R.VENTAS}${qs(p)}`, { headers: headers() }))
}

export async function fetchOcupacion(p: { fecha_inicio?: string; fecha_fin?: string }): Promise<OcupacionReporte> {
  return handle(await fetch(`${API_BASE_URL}${R.OCUPACION}${qs(p)}`, { headers: headers() }))
}

export async function fetchNps(p: { fecha_inicio?: string; fecha_fin?: string }): Promise<NpsReporte> {
  return handle(await fetch(`${API_BASE_URL}${R.NPS}${qs(p)}`, { headers: headers() }))
}

// ── Recepción ─────────────────────────────────────────────────────────────────

export async function fetchCronograma(fecha: string): Promise<{ fecha: string; citas: CitaCronograma[] }> {
  return handle(await fetch(`${API_BASE_URL}${R.CRONOGRAMA}?fecha=${fecha}`, { headers: headers() }))
}

export async function fetchCancelaciones(p: { fecha_inicio?: string; fecha_fin?: string }): Promise<{
  cancelaciones: CancelacionItem[]
  resumen: { total_canceladas: number; con_motivo: number }
}> {
  return handle(await fetch(`${API_BASE_URL}${R.CANCELACIONES}${qs(p)}`, { headers: headers() }))
}

// ── Groomer ───────────────────────────────────────────────────────────────────

export async function fetchProductividad(p: { fecha_inicio?: string; fecha_fin?: string; id_trabajador?: string }): Promise<{
  periodo: { inicio: string; fin: string }
  groomers: ProductividadGroomer[]
}> {
  return handle(await fetch(`${API_BASE_URL}${R.PRODUCTIVIDAD}${qs(p)}`, { headers: headers() }))
}

export async function fetchMisInsumos(p: { fecha_inicio?: string; fecha_fin?: string }): Promise<{
  periodo: { inicio: string; fin: string }
  insumos: InsumoGroomer[]
  resumen: { tipos_insumos: number; citas_con_insumos: number }
}> {
  return handle(await fetch(`${API_BASE_URL}${R.MIS_INSUMOS}${qs(p)}`, { headers: headers() }))
}

// ── Cliente ───────────────────────────────────────────────────────────────────

export async function fetchHistorialClinico(idMascota?: string): Promise<{ historial: HistorialCita[] }> {
  const q = idMascota ? `?id_mascota=${idMascota}` : ''
  return handle(await fetch(`${API_BASE_URL}${R.HISTORIAL_CLINICO}${q}`, { headers: headers() }))
}

export async function fetchMisPromociones(): Promise<{
  usadas: PromocionUsada[]
  disponibles: PromocionDisponible[]
}> {
  return handle(await fetch(`${API_BASE_URL}${R.MIS_PROMOCIONES}`, { headers: headers() }))
}

export async function fetchRecomendaciones(idMascota: string): Promise<{
  mascota: { nombre: string; tamano: string; temperamento: string }
  categorias: string[]
  razones: string[]
  productos: {
    id_producto: string; nombre: string; descripcion: string | null
    categoria: string; precio: number; stock: number; imagen_url: string | null
  }[]
}> {
  return handle(await fetch(`${API_BASE_URL}${R.RECOMENDACIONES(idMascota)}`, { headers: headers() }))
}

export async function crearCalificacion(payload: {
  id_cita: string; puntuacion: number; comentario?: string
}): Promise<{ calificacion: { id_calificacion: string; puntuacion: number } }> {
  return handle(await fetch(`${API_BASE_URL}${R.CALIFICACIONES}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(payload),
  }))
}
