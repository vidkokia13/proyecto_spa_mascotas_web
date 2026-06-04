<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductosStore } from '@/presentation/stores/productos.store'
import { usePedidoStore }    from '@/presentation/stores/pedido.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import type { CategoriaProducto, Producto } from '@/shared/types/agenda.types'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const productosStore = useProductosStore()
const pedidoStore    = usePedidoStore()
const router         = useRouter()

const CATEGORIAS: { value: CategoriaProducto | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'alimento',  label: 'Alimento'  },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'higiene',   label: 'Higiene'   },
  { value: 'juguete',   label: 'Juguete'   },
  { value: 'salud',     label: 'Salud'     },
  { value: 'otro',      label: 'Otro'      },
]

const filtroCat = ref<CategoriaProducto | ''>('')
const buscar    = ref('')

const productosFiltrados = computed(() => {
  let list = productosStore.productos.filter(p => p.activo && p.stock > 0)
  if (filtroCat.value) list = list.filter(p => p.categoria === filtroCat.value)
  if (buscar.value)    list = list.filter(p => p.nombre.toLowerCase().includes(buscar.value.toLowerCase()))
  return list
})

const cantidadEnCarrito = (idProducto: string) => {
  return pedidoStore.carrito.find(i => i.idProducto === idProducto)?.cantidad ?? 0
}

onMounted(() => productosStore.cargar())

function agregar(p: Producto) {
  pedidoStore.agregarAlCarrito({ idProducto: p.id_producto, nombre: p.nombre, precio: p.precio, imagen_url: p.imagen_url })
}

function irAlCarrito() {
  router.push({ name: ROUTE_NAMES.CLIENT_CARRITO })
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Cabecera -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tienda</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Productos disponibles para tu mascota</p>
      </div>
      <!-- Botón carrito → navega a CarritoView -->
      <button
        class="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition"
        @click="irAlCarrito"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Carrito
        <span v-if="pedidoStore.carrito.length" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ pedidoStore.carrito.reduce((a, i) => a + i.cantidad, 0) }}
        </span>
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="c in CATEGORIAS" :key="c.value"
        :class="[
          'px-4 py-1.5 rounded-full text-sm font-medium transition',
          filtroCat === c.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
        ]"
        @click="filtroCat = c.value"
      >{{ c.label }}</button>
    </div>

    <input
      v-model="buscar" type="text" placeholder="Buscar producto..."
      class="w-full max-w-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    />

    <!-- Loading -->
    <div v-if="productosStore.loading" class="text-center py-16 text-gray-400">Cargando productos...</div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="p in productosFiltrados" :key="p.id_producto"
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col"
      >
        <!-- Imagen -->
        <div class="h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          <img v-if="p.imagen_url" :src="p.imagen_url" :alt="p.nombre" class="w-full h-full object-cover" />
          <svg v-else class="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div class="p-4 flex flex-col flex-1 gap-2">
          <span class="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">{{ p.categoria }}</span>
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{{ p.nombre }}</h3>
          <p v-if="p.descripcion" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{{ p.descripcion }}</p>

          <div class="flex items-center justify-between mt-auto pt-2">
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">Bs {{ Number(p.precio).toFixed(2) }}</span>
            <span class="text-xs text-gray-400">{{ p.stock }} disp.</span>
          </div>

          <!-- Controles carrito -->
          <div v-if="cantidadEnCarrito(p.id_producto) === 0">
            <button
              class="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition"
              @click="agregar(p)"
            >Agregar al carrito</button>
          </div>
          <div v-else class="flex items-center gap-2">
            <button
              class="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              @click="pedidoStore.cambiarCantidad(p.id_producto, cantidadEnCarrito(p.id_producto) - 1)"
            >−</button>
            <span class="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ cantidadEnCarrito(p.id_producto) }}</span>
            <button
              class="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition"
              @click="agregar(p)"
            >+</button>
          </div>
        </div>
      </div>

      <div v-if="productosFiltrados.length === 0" class="col-span-full text-center py-16 text-gray-400">
        No hay productos disponibles.
      </div>
    </div>

  </div>
</template>
