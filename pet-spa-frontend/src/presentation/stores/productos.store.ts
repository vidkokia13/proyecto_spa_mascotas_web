import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Producto, CategoriaProducto, CreateProductoPayload, UpdateProductoPayload } from '@/shared/types/agenda.types'
import * as ds from '@/data/datasources/ProductoDatasource'

export const useProductosStore = defineStore('productos', () => {
  const productos  = ref<Producto[]>([])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  async function cargar(params?: { categoria?: CategoriaProducto; buscar?: string }) {
    loading.value = true
    error.value   = null
    try {
      productos.value = await ds.fetchProductos(params)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function crear(payload: CreateProductoPayload, imagen?: File) {
    const p = await ds.createProducto(payload, imagen)
    // Recarga desde el servidor para reflejar la URL real de Cloudinary
    await cargar()
    return p
  }

  async function actualizar(id: string, payload: UpdateProductoPayload, imagen?: File) {
    const p = await ds.updateProducto(id, payload, imagen)
    // Recarga para asegurar que imagen_url e imagen_public_id estén actualizados
    await cargar()
    return p
  }

  async function eliminarImagen(id: string) {
    const p = await ds.deleteProductoImagen(id)
    // Actualiza solo el producto afectado localmente (operación rápida)
    const idx = productos.value.findIndex(x => x.id_producto === id)
    if (idx !== -1) productos.value[idx] = { ...productos.value[idx], imagen_url: null, imagen_public_id: null }
    return p
  }

  async function eliminar(id: string) {
    await ds.deleteProducto(id)
    // Elimina localmente sin re-fetch (el producto ya no existe en Cloudinary)
    productos.value = productos.value.filter(x => x.id_producto !== id)
  }

  return { productos, loading, error, cargar, crear, actualizar, eliminarImagen, eliminar }
})
