<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductosStore } from '@/presentation/stores/productos.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import type { Producto, CategoriaProducto, CreateProductoPayload } from '@/shared/types/agenda.types'

const store = useProductosStore()

const CATEGORIAS: CategoriaProducto[] = ['alimento', 'accesorio', 'higiene', 'juguete', 'salud', 'otro']
const CATEGORIA_LABELS: Record<CategoriaProducto, string> = {
  alimento: 'Alimento', accesorio: 'Accesorio', higiene: 'Higiene',
  juguete: 'Juguete', salud: 'Salud', otro: 'Otro',
}

const showModal       = ref(false)
const editId          = ref<string | null>(null)
const filtroCat       = ref<CategoriaProducto | ''>('')
const buscar          = ref('')
const imagenFile      = ref<File | null>(null)
const imagenPreview   = ref<string | null>(null)
const imagenEliminada = ref(false)   // flag: el usuario pidió borrar imagen actual en el modal
const confirmEliminar = ref<Producto | null>(null)
const toastMsg        = ref('')
let   toastTimer: ReturnType<typeof setTimeout> | null = null

function toast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}

const form = ref<CreateProductoPayload & { activo?: boolean }>({
  nombre: '', descripcion: null, categoria: 'otro', precio: 0, stock: 0, stockMinimo: 5,
})

const isEdit = computed(() => !!editId.value)

const productosFiltrados = computed(() => {
  let list = store.productos
  if (filtroCat.value) list = list.filter(p => p.categoria === filtroCat.value)
  if (buscar.value)    list = list.filter(p => p.nombre.toLowerCase().includes(buscar.value.toLowerCase()))
  return list
})

onMounted(() => store.cargar({ soloActivos: false }))

function openCreate() {
  editId.value = null
  form.value   = { nombre: '', descripcion: null, categoria: 'otro', precio: 0, stock: 0, stockMinimo: 5 }
  imagenFile.value    = null
  imagenPreview.value = null
  showModal.value = true
}

function openEdit(p: Producto) {
  editId.value = p.id_producto
  form.value   = {
    nombre:      p.nombre,
    descripcion: p.descripcion,
    categoria:   p.categoria,
    precio:      p.precio,
    stock:       p.stock,
    stockMinimo: p.stock_minimo,
    activo:      p.activo,
  }
  imagenFile.value    = null
  imagenPreview.value = p.imagen_url
  imagenEliminada.value = false
  showModal.value = true
}

function quitarImagenModal() {
  imagenFile.value    = null
  imagenPreview.value = null
  imagenEliminada.value = true
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imagenFile.value = file
  imagenPreview.value = URL.createObjectURL(file)
}

async function submit() {
  try {
    if (isEdit.value) {
      // Si el usuario pidió eliminar la imagen en el modal, hacerlo primero
      if (imagenEliminada.value) {
        const existing = store.productos.find(p => p.id_producto === editId.value)
        if (existing?.imagen_public_id) await store.eliminarImagen(editId.value!)
      }
      await store.actualizar(editId.value!, form.value, imagenFile.value ?? undefined)
      toast('Producto actualizado correctamente.')
    } else {
      await store.crear(form.value, imagenFile.value ?? undefined)
      toast('Producto creado correctamente.')
    }
    showModal.value = false
  } catch (e: any) {
    alert(e.message)
  }
}

async function eliminarImagenCard(p: Producto) {
  if (!confirm(`¿Eliminar la imagen de "${p.nombre}"?\nTambién se eliminará de Cloudinary.`)) return
  await store.eliminarImagen(p.id_producto)
  toast('Imagen eliminada de Cloudinary.')
}

async function confirmarEliminar() {
  if (!confirmEliminar.value) return
  await store.eliminar(confirmEliminar.value.id_producto)
  toast(`Producto "${confirmEliminar.value.nombre}" eliminado (imagen borrada de Cloudinary).`)
  confirmEliminar.value = null
}

function badgeVariant(cat: CategoriaProducto) {
  const map: Record<CategoriaProducto, string> = {
    alimento: 'success', accesorio: 'info', higiene: 'warning',
    juguete: 'purple', salud: 'error', otro: 'default',
  }
  return map[cat] ?? 'default'
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Toast de éxito -->
    <transition name="fade">
      <div
        v-if="toastMsg"
        class="fixed top-5 right-5 z-50 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ toastMsg }}
      </div>
    </transition>
    <!-- Cabecera -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Gestión del catálogo de la tienda</p>
      </div>
      <BaseButton @click="openCreate">+ Nuevo producto</BaseButton>
    </div>

    <!-- Filtros -->
    <BaseCard>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="buscar"
          type="text" placeholder="Buscar por nombre..."
          class="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          v-model="filtroCat"
          class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas las categorías</option>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ CATEGORIA_LABELS[c] }}</option>
        </select>
      </div>
    </BaseCard>

    <!-- Loading / Error -->
    <div v-if="store.loading" class="text-center py-12 text-gray-400">Cargando productos...</div>
    <div v-else-if="store.error" class="text-center py-12 text-red-500">{{ store.error }}</div>

    <!-- Grid de productos -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="p in productosFiltrados" :key="p.id_producto"
        :class="[
          'rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition',
          p.activo
            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-70',
        ]"
      >
        <!-- Imagen -->
        <div class="relative h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img v-if="p.imagen_url" :src="p.imagen_url" :alt="p.nombre" class="w-full h-full object-cover" />
          <svg v-else class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <!-- Badge estado -->
          <span v-if="!p.activo" class="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">Inactivo</span>
          <span v-if="p.activo && p.stock === 0" class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Sin stock</span>
          <span v-else-if="p.activo && p.stock <= p.stock_minimo" class="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Stock bajo</span>
        </div>

        <div class="p-4 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{{ p.nombre }}</h3>
            <BaseBadge :variant="badgeVariant(p.categoria) as any" size="sm">{{ CATEGORIA_LABELS[p.categoria] }}</BaseBadge>
          </div>
          <p v-if="p.descripcion" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ p.descripcion }}</p>

          <div class="flex items-center justify-between text-sm">
            <span class="font-bold text-primary-600 dark:text-primary-400">Bs {{ Number(p.precio).toFixed(2) }}</span>
            <span class="text-gray-500 dark:text-gray-400">Stock: {{ p.stock }}</span>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2 pt-2">
            <button
              class="flex-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 transition"
              @click="openEdit(p)"
            >Editar</button>
            <button
              v-if="p.imagen_url"
              class="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition"
              @click="eliminarImagenCard(p)"
              title="Eliminar imagen de Cloudinary"
            >🗑 Img</button>
            <button
              class="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 transition"
              @click="confirmEliminar = p"
            >Eliminar</button>
          </div>
        </div>
      </div>

      <div v-if="productosFiltrados.length === 0" class="col-span-full text-center py-12 text-gray-400">
        No hay productos que coincidan con los filtros.
      </div>
    </div>

    <!-- Modal crear/editar -->
    <BaseModal :open="showModal" :title="isEdit ? 'Editar producto' : 'Nuevo producto'" @close="showModal = false">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
          <input v-model="form.nombre" required class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
            <select v-model="form.categoria" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ CATEGORIA_LABELS[c] }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio (Bs) *</label>
            <input v-model.number="form.precio" type="number" min="0" step="0.01" required class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
            <input v-model.number="form.stock" type="number" min="0" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock mínimo</label>
            <input v-model.number="form.stockMinimo" type="number" min="0" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
          <textarea v-model="form.descripcion" rows="2" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <!-- Imagen -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen</label>
          <div v-if="imagenPreview && !imagenEliminada" class="mb-2 flex items-start gap-3">
            <img :src="imagenPreview" class="h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              class="text-xs text-red-500 hover:text-red-700 hover:underline mt-1"
              @click="quitarImagenModal"
            >Quitar imagen (elimina de Cloudinary al guardar)</button>
          </div>
          <div v-else-if="imagenEliminada" class="mb-2 text-xs text-amber-600 dark:text-amber-400">
            La imagen actual será eliminada de Cloudinary al guardar.
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="text-sm" @change="onFileChange" />
          <p class="text-xs text-gray-400 mt-1">Selecciona un archivo para reemplazar la imagen actual.</p>
        </div>

        <div v-if="isEdit" class="flex items-center gap-2">
          <input id="activo" v-model="form.activo" type="checkbox" class="rounded" />
          <label for="activo" class="text-sm text-gray-700 dark:text-gray-300">Activo</label>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :disabled="store.loading">{{ isEdit ? 'Guardar cambios' : 'Crear producto' }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Confirmar eliminar -->
    <BaseModal :open="!!confirmEliminar" title="Eliminar producto" @close="confirmEliminar = null">
      <div class="mb-4 space-y-2">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          ¿Eliminar el producto <strong>{{ confirmEliminar?.nombre }}</strong>?
        </p>
        <ul class="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1">
          <li>El producto dejará de aparecer en la tienda.</li>
          <li v-if="confirmEliminar?.imagen_url" class="text-amber-600 dark:text-amber-400 font-medium">La imagen será eliminada permanentemente de Cloudinary.</li>
        </ul>
      </div>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="confirmEliminar = null">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="confirmarEliminar">Eliminar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
