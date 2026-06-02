<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePedidoStore }   from '@/presentation/stores/pedido.store'
import { useProductosStore } from '@/presentation/stores/productos.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import * as pedidoDs from '@/data/datasources/PedidoDatasource'
import type { Pedido, PedidoItem, EstadoPedido } from '@/shared/types/agenda.types'

const pedidoStore   = usePedidoStore()
const productosStore = useProductosStore()

const filtroEstado = ref<EstadoPedido | ''>('')
const detalle      = ref<{ pedido: Pedido; items: PedidoItem[] } | null>(null)
const waLink       = ref<string | null>(null)
const waTel        = ref('')
const showWa       = ref(false)
const showNuevo    = ref(false)

// Modal pago al completar
const showPago     = ref(false)
const pedidoPago   = ref<Pedido | null>(null)
const metodoPago   = ref<'efectivo' | 'qr' | 'transferencia'>('efectivo')
const referenciaPago = ref('')

// Carrito para crear pedido desde recepción
const carritoRec = ref<{ idProducto: string; nombre: string; precio: number; cantidad: number }[]>([])
const notasRec   = ref('')
const buscarProd = ref('')

const productosFiltrados = computed(() => {
  if (!buscarProd.value) return productosStore.productos.filter(p => p.activo && p.stock > 0)
  return productosStore.productos.filter(p => p.activo && p.stock > 0 &&
    p.nombre.toLowerCase().includes(buscarProd.value.toLowerCase()))
})

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  borrador:   'Borrador',
  enviado:    'Enviado',
  completado: 'Completado',
  cancelado:  'Cancelado',
}
const ESTADO_VARIANT: Record<EstadoPedido, string> = {
  borrador:   'default',
  enviado:    'info',
  completado: 'success',
  cancelado:  'error',
}

const pedidosFiltrados = computed(() => {
  if (!filtroEstado.value) return pedidoStore.pedidos
  return pedidoStore.pedidos.filter(p => p.estado === filtroEstado.value)
})

onMounted(async () => {
  await Promise.all([pedidoStore.cargarTodos(), productosStore.cargar()])
})

async function verDetalle(p: Pedido) {
  const result = await pedidoDs.fetchPedidoById(p.id_pedido)
  detalle.value = result
}

async function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
  if (estado === 'completado') {
    // Pide método de pago antes de completar
    pedidoPago.value   = pedido
    metodoPago.value   = 'efectivo'
    referenciaPago.value = ''
    showPago.value     = true
    return
  }
  await pedidoStore.cambiarEstado(pedido.id_pedido, estado)
  if (detalle.value?.pedido.id_pedido === pedido.id_pedido) {
    detalle.value.pedido.estado = estado
  }
}

async function confirmarPago() {
  if (!pedidoPago.value) return
  await pedidoStore.cambiarEstado(pedidoPago.value.id_pedido, 'completado', {
    metodo:     metodoPago.value,
    referencia: referenciaPago.value || undefined,
  })
  if (detalle.value?.pedido.id_pedido === pedidoPago.value.id_pedido) {
    detalle.value.pedido.estado = 'completado'
  }
  showPago.value   = false
  pedidoPago.value = null
}

async function abrirWhatsApp(p: Pedido) {
  detalle.value = await pedidoDs.fetchPedidoById(p.id_pedido)
  waTel.value = ''
  waLink.value = null
  showWa.value = true
}

async function generarLink() {
  if (!detalle.value) return
  waLink.value = await pedidoStore.getWhatsappLink(detalle.value.pedido.id_pedido, waTel.value || undefined)
}

// Crear pedido desde recepción
function agregarRec(prod: { id_producto: string; nombre: string; precio: number }) {
  const ex = carritoRec.value.find(i => i.idProducto === prod.id_producto)
  if (ex) ex.cantidad++
  else carritoRec.value.push({ idProducto: prod.id_producto, nombre: prod.nombre, precio: prod.precio, cantidad: 1 })
}

function quitarRec(id: string) {
  carritoRec.value = carritoRec.value.filter(i => i.idProducto !== id)
}

const totalRec = computed(() => carritoRec.value.reduce((a, i) => a + i.precio * i.cantidad, 0))

async function confirmarNuevo() {
  if (!carritoRec.value.length) return
  try {
    await pedidoDs.createPedido({
      items: carritoRec.value.map(i => ({ idProducto: i.idProducto, cantidad: i.cantidad })),
      notas: notasRec.value || undefined,
    })
    carritoRec.value = []
    notasRec.value   = ''
    showNuevo.value  = false
    await pedidoStore.cargarTodos()
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Cabecera -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pedidos de tienda</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Gestión de pedidos de productos</p>
      </div>
      <BaseButton @click="showNuevo = true">+ Nuevo pedido</BaseButton>
    </div>

    <!-- Filtro estado -->
    <BaseCard>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in [{ v: '', l: 'Todos' }, { v: 'borrador', l: 'Borrador' }, { v: 'enviado', l: 'Enviado' }, { v: 'completado', l: 'Completado' }, { v: 'cancelado', l: 'Cancelado' }]"
          :key="opt.v"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition',
            filtroEstado === opt.v
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
          ]"
          @click="filtroEstado = opt.v as any"
        >{{ opt.l }}</button>
      </div>
    </BaseCard>

    <!-- Loading -->
    <div v-if="pedidoStore.loading" class="text-center py-12 text-gray-400">Cargando pedidos...</div>

    <!-- Tabla -->
    <BaseCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">ID</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Total</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
              <th class="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pedidosFiltrados" :key="p.id_pedido"
              class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <td class="py-3 px-4 font-mono text-xs text-gray-500">#{{ p.id_pedido.slice(-6).toUpperCase() }}</td>
              <td class="py-3 px-4 text-gray-900 dark:text-white">{{ p.cliente_nombre ?? '—' }}</td>
              <td class="py-3 px-4 font-semibold text-primary-600 dark:text-primary-400">Bs {{ Number(p.total).toFixed(2) }}</td>
              <td class="py-3 px-4">
                <BaseBadge :variant="ESTADO_VARIANT[p.estado] as any" size="sm">{{ ESTADO_LABELS[p.estado] }}</BaseBadge>
              </td>
              <td class="py-3 px-4 text-gray-500 text-xs">{{ new Date(p.creado_en).toLocaleDateString('es-BO') }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button class="text-xs text-primary-600 hover:underline" @click="verDetalle(p)">Ver</button>
                  <button class="text-xs text-green-600 hover:underline" @click="abrirWhatsApp(p)">WhatsApp</button>
                  <select
                    :value="p.estado"
                    class="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    @change="cambiarEstado(p, ($event.target as HTMLSelectElement).value as EstadoPedido)"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="enviado">Enviado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </td>
            </tr>
            <tr v-if="pedidosFiltrados.length === 0">
              <td colspan="6" class="text-center py-10 text-gray-400">No hay pedidos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Modal detalle pedido -->
    <BaseModal :open="!!detalle" title="Detalle del pedido" @close="detalle = null">
      <div v-if="detalle" class="space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Estado:</span>
          <BaseBadge :variant="ESTADO_VARIANT[detalle.pedido.estado] as any">{{ ESTADO_LABELS[detalle.pedido.estado] }}</BaseBadge>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in detalle.items" :key="item.id_item"
            class="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <img v-if="item.imagen_url" :src="item.imagen_url" class="w-10 h-10 rounded object-cover" />
            <div v-else class="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700" />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.nombre }}</p>
              <p class="text-xs text-gray-500">{{ item.cantidad }} × Bs {{ Number(item.precio_unitario).toFixed(2) }}</p>
            </div>
            <span class="text-sm font-semibold">Bs {{ Number(item.subtotal).toFixed(2) }}</span>
          </div>
        </div>
        <div class="flex justify-between font-bold text-gray-900 dark:text-white pt-2">
          <span>Total</span>
          <span class="text-primary-600 dark:text-primary-400">Bs {{ Number(detalle.pedido.total).toFixed(2) }}</span>
        </div>
        <div v-if="detalle.pedido.notas" class="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <strong>Notas:</strong> {{ detalle.pedido.notas }}
        </div>
      </div>
    </BaseModal>

    <!-- Modal WhatsApp -->
    <BaseModal :open="showWa" title="Enviar por WhatsApp" @close="showWa = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de WhatsApp (opcional)</label>
          <input v-model="waTel" type="tel" placeholder="591 7XXXXXXX" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="flex gap-3">
          <BaseButton @click="generarLink">Generar link</BaseButton>
        </div>
        <a
          v-if="waLink"
          :href="waLink" target="_blank" rel="noopener"
          class="block text-center py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition"
        >
          Abrir en WhatsApp
        </a>
      </div>
    </BaseModal>

    <!-- Modal registrar pago al completar pedido -->
    <BaseModal :open="showPago" title="Registrar pago" @close="showPago = false">
      <div v-if="pedidoPago" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Pedido <strong>#{{ pedidoPago.id_pedido.slice(-6).toUpperCase() }}</strong> —
          Total: <strong class="text-primary-600">Bs {{ Number(pedidoPago.total).toFixed(2) }}</strong>
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método de pago *</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="m in [{ v: 'efectivo', l: 'Efectivo' }, { v: 'qr', l: 'QR' }, { v: 'transferencia', l: 'Transferencia' }]"
              :key="m.v"
              :class="[
                'py-2 px-3 rounded-xl border text-sm font-medium transition',
                metodoPago === m.v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ]"
              @click="metodoPago = m.v as any"
            >{{ m.l }}</button>
          </div>
        </div>

        <div v-if="metodoPago !== 'efectivo'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia (opcional)</label>
          <input v-model="referenciaPago" type="text" placeholder="Nro. de transacción o código QR" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <p class="text-xs text-gray-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2">
          Este pago se registrará en la caja del día de hoy.
        </p>

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showPago = false">Cancelar</BaseButton>
          <BaseButton @click="confirmarPago">Confirmar y completar</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal nuevo pedido desde recepción -->
    <BaseModal :open="showNuevo" title="Crear pedido" @close="showNuevo = false; carritoRec = []; buscarProd = ''">
      <div class="space-y-4">
        <input v-model="buscarProd" type="text" placeholder="Buscar producto..." class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

        <div class="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-700 rounded-lg p-2">
          <div
            v-for="p in productosFiltrados" :key="p.id_producto"
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            @click="agregarRec(p)"
          >
            <div>
              <p class="text-sm text-gray-900 dark:text-white">{{ p.nombre }}</p>
              <p class="text-xs text-gray-500">Bs {{ Number(p.precio).toFixed(2) }} · Stock: {{ p.stock }}</p>
            </div>
            <span class="text-primary-600 text-lg font-bold">+</span>
          </div>
        </div>

        <div v-if="carritoRec.length" class="space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionados:</p>
          <div v-for="i in carritoRec" :key="i.idProducto" class="flex items-center gap-2 text-sm">
            <span class="flex-1 text-gray-900 dark:text-white">{{ i.nombre }}</span>
            <span class="text-gray-500">× {{ i.cantidad }}</span>
            <span class="text-primary-600 font-semibold">Bs {{ (i.precio * i.cantidad).toFixed(2) }}</span>
            <button class="text-red-400 hover:text-red-600" @click="quitarRec(i.idProducto)">×</button>
          </div>
          <div class="flex justify-between font-bold pt-1 text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-700">
            <span>Total</span>
            <span class="text-primary-600">Bs {{ totalRec.toFixed(2) }}</span>
          </div>
        </div>

        <textarea v-model="notasRec" rows="2" placeholder="Notas (opcional)" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showNuevo = false; carritoRec = []">Cancelar</BaseButton>
          <BaseButton :disabled="!carritoRec.length" @click="confirmarNuevo">Confirmar pedido</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
