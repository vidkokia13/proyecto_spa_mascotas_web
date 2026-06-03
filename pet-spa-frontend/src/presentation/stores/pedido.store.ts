import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Pedido, PedidoItem, CreatePedidoItem, EstadoPedido, MetodoPago } from '@/shared/types/agenda.types'
import * as ds from '@/data/datasources/PedidoDatasource'

const CARRITO_KEY     = 'petspa_carrito'
const CARRITO_VERSION = '2'  // incrementar si cambia la estructura
const CARRITO_VER_KEY = 'petspa_carrito_v'

type CarritoItem = CreatePedidoItem & { nombre: string; precio: number; imagen_url: string | null }

function cargarDesdeStorage(): CarritoItem[] {
  try {
    // Si la versión del carrito guardado no coincide, descartarlo
    if (localStorage.getItem(CARRITO_VER_KEY) !== CARRITO_VERSION) {
      localStorage.removeItem(CARRITO_KEY)
      localStorage.setItem(CARRITO_VER_KEY, CARRITO_VERSION)
      return []
    }
    const raw = localStorage.getItem(CARRITO_KEY)
    if (!raw) return []
    const items = JSON.parse(raw) as any[]
    // Garantizar tipos numéricos (pg retorna DECIMAL como string)
    return items.map(i => ({
      ...i,
      cantidad: Number(i.cantidad),
      precio:   Number(i.precio),
    }))
  } catch {
    localStorage.removeItem(CARRITO_KEY)
    return []
  }
}

export const usePedidoStore = defineStore('pedido', () => {
  const pedidos  = ref<Pedido[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  // Carrito — se carga desde localStorage al inicializar
  const carrito  = ref<CarritoItem[]>(cargarDesdeStorage())

  // Guarda automáticamente en localStorage cuando el carrito cambia
  watch(carrito, (val) => {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(val))
  }, { deep: true })

  function agregarAlCarrito(item: { idProducto: string; nombre: string; precio: number; imagen_url: string | null }) {
    const existing = carrito.value.find(x => x.idProducto === item.idProducto)
    if (existing) {
      existing.cantidad++
    } else {
      carrito.value.push({
        idProducto: item.idProducto,
        cantidad:   1,
        nombre:     item.nombre,
        precio:     Number(item.precio),  // pg retorna DECIMAL como string
        imagen_url: item.imagen_url,
      })
    }
  }

  function quitarDelCarrito(idProducto: string) {
    carrito.value = carrito.value.filter(x => x.idProducto !== idProducto)
  }

  function cambiarCantidad(idProducto: string, cantidad: number) {
    const item = carrito.value.find(x => x.idProducto === idProducto)
    if (item) { if (cantidad <= 0) quitarDelCarrito(idProducto); else item.cantidad = cantidad }
  }

  function limpiarCarrito() {
    carrito.value = []
    localStorage.removeItem(CARRITO_KEY)
  }

  const totalCarrito = () => carrito.value.reduce((acc, i) => acc + Number(i.precio) * Number(i.cantidad), 0)

  async function confirmarPedido(notas?: string, metodoPago?: MetodoPago | null, referenciaPago?: string) {
    loading.value = true
    error.value   = null
    try {
      const result = await ds.createPedido({
        items: carrito.value.map(i => ({ idProducto: i.idProducto, cantidad: i.cantidad })),
        notas,
        metodoPago:    metodoPago ?? null,
        referenciaPago: referenciaPago || null,
      })
      limpiarCarrito()
      return result
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cargarMisPedidos() {
    loading.value = true
    error.value   = null
    try { pedidos.value = await ds.fetchMisPedidos() }
    catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function cargarTodos(estado?: EstadoPedido) {
    loading.value = true
    error.value   = null
    try { pedidos.value = await ds.fetchTodosPedidos(estado) }
    catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function cambiarEstado(
    id: string, estado: EstadoPedido,
    pago?: { metodo: 'efectivo' | 'qr' | 'transferencia'; referencia?: string },
  ) {
    const p = await ds.cambiarEstadoPedido(id, estado, pago)
    const idx = pedidos.value.findIndex(x => x.id_pedido === id)
    if (idx !== -1) pedidos.value[idx] = p
    return p
  }

  async function getWhatsappLink(id: string, tel?: string) {
    return ds.fetchWhatsappLink(id, tel)
  }

  return {
    pedidos, loading, error, carrito, totalCarrito,
    agregarAlCarrito, quitarDelCarrito, cambiarCantidad, limpiarCarrito,
    confirmarPedido, cargarMisPedidos, cargarTodos, cambiarEstado, getWhatsappLink,
  }
})
