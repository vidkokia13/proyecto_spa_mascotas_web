<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePedidoStore }   from '@/presentation/stores/pedido.store'
import { useProductosStore } from '@/presentation/stores/productos.store'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import * as pedidoDs from '@/data/datasources/PedidoDatasource'
import type { Pedido, PedidoItem, EstadoPedido, MetodoPago } from '@/shared/types/agenda.types'

const pedidoStore    = usePedidoStore()
const productosStore = useProductosStore()

const filtroEstado = ref<EstadoPedido | ''>('')
const detalle      = ref<{ pedido: Pedido; items: PedidoItem[] } | null>(null)
const waLink       = ref<string | null>(null)
const waTel        = ref('')
const showWa       = ref(false)
const showNuevo    = ref(false)

// Modal pago al completar pedido existente
const showPago     = ref(false)
const pedidoPago   = ref<Pedido | null>(null)
const metodoPago   = ref<MetodoPago>('efectivo')
const referenciaPago = ref('')

// Nuevo pedido desde recepción
const carritoRec    = ref<{ idProducto: string; nombre: string; precio: number; cantidad: number }[]>([])
const notasRec      = ref('')
const buscarProd    = ref('')
const metodoNuevo   = ref<MetodoPago>('efectivo')
const referenciaNew = ref('')
const ventaDirecta  = ref(true)  // si true → completar + registrar en caja

const METODOS: { v: MetodoPago; l: string }[] = [
  { v: 'efectivo',       l: 'Efectivo' },
  { v: 'qr',            l: 'QR' },
  { v: 'transferencia', l: 'Transferencia' },
]

const METODO_LABELS: Record<MetodoPago, string> = {
  efectivo:       'Efectivo',
  qr:            'QR',
  transferencia: 'Transferencia',
}

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

const productosFiltrados = computed(() => {
  const list = productosStore.productos.filter(p => p.activo && p.stock > 0)
  if (!buscarProd.value) return list
  return list.filter(p => p.nombre.toLowerCase().includes(buscarProd.value.toLowerCase()))
})

const pedidosFiltrados = computed(() => {
  if (!filtroEstado.value) return pedidoStore.pedidos
  return pedidoStore.pedidos.filter(p => p.estado === filtroEstado.value)
})

const totalRec = computed(() => carritoRec.value.reduce((a, i) => a + Number(i.precio) * i.cantidad, 0))

onMounted(async () => {
  await Promise.all([pedidoStore.cargarTodos(), productosStore.cargar()])
})

// ── Detalle ───────────────────────────────────────────────────────────────────

async function verDetalle(p: Pedido) {
  detalle.value = await pedidoDs.fetchPedidoById(p.id_pedido)
}

// ── Cambiar estado pedido existente ──────────────────────────────────────────

async function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
  if (estado === 'completado') {
    pedidoPago.value    = pedido
    metodoPago.value    = (pedido.metodo_pago as MetodoPago) ?? 'efectivo'
    referenciaPago.value = pedido.referencia_pago ?? ''
    showPago.value      = true
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

// ── WhatsApp ──────────────────────────────────────────────────────────────────

async function abrirWhatsApp(p: Pedido) {
  detalle.value = await pedidoDs.fetchPedidoById(p.id_pedido)
  waTel.value   = ''
  waLink.value  = null
  showWa.value  = true
}

async function generarLink() {
  if (!detalle.value) return
  waLink.value = await pedidoStore.getWhatsappLink(detalle.value.pedido.id_pedido, waTel.value || undefined)
}

// ── Nuevo pedido desde recepción ─────────────────────────────────────────────

function agregarRec(prod: { id_producto: string; nombre: string; precio: number }) {
  const ex = carritoRec.value.find(i => i.idProducto === prod.id_producto)
  if (ex) ex.cantidad++
  else carritoRec.value.push({ idProducto: prod.id_producto, nombre: prod.nombre, precio: Number(prod.precio), cantidad: 1 })
}

function quitarRec(id: string) {
  carritoRec.value = carritoRec.value.filter(i => i.idProducto !== id)
}

function cerrarNuevo() {
  showNuevo.value   = false
  carritoRec.value  = []
  notasRec.value    = ''
  buscarProd.value  = ''
  referenciaNew.value = ''
  metodoNuevo.value = 'efectivo'
  ventaDirecta.value = true
}

async function confirmarNuevo() {
  if (!carritoRec.value.length) return
  try {
    await pedidoDs.createPedido({
      items:                   carritoRec.value.map(i => ({ idProducto: i.idProducto, cantidad: i.cantidad })),
      notas:                   notasRec.value || undefined,
      metodoPago:              metodoNuevo.value,
      referenciaPago:          referenciaNew.value || undefined,
      completarInmediatamente: ventaDirecta.value,
    })
    cerrarNuevo()
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
        <p class="text-sm text-gray-500 dark:text-gray-400">Gestión de pedidos y ventas de productos</p>
      </div>
      <BaseButton @click="showNuevo = true">+ Registrar venta</BaseButton>
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

    <div v-if="pedidoStore.loading" class="text-center py-12 text-gray-400">Cargando pedidos...</div>

    <!-- Tabla -->
    <BaseCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">ID</th>
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Pago</th>
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Estado</th>
              <th class="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
              <th class="py-3 px-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pedidosFiltrados" :key="p.id_pedido"
              class="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <td class="py-3 px-3 font-mono text-xs text-gray-500">#{{ p.id_pedido.slice(-6).toUpperCase() }}</td>
              <td class="py-3 px-3 text-gray-900 dark:text-white">{{ p.cliente_nombre ?? '—' }}</td>
              <td class="py-3 px-3 font-semibold text-primary-600 dark:text-primary-400">Bs {{ Number(p.total).toFixed(2) }}</td>
              <td class="py-3 px-3">
                <span v-if="p.metodo_pago" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {{ METODO_LABELS[p.metodo_pago] }}
                </span>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="py-3 px-3">
                <BaseBadge :variant="ESTADO_VARIANT[p.estado] as any" size="sm">{{ ESTADO_LABELS[p.estado] }}</BaseBadge>
              </td>
              <td class="py-3 px-3 text-gray-500 text-xs">{{ new Date(p.creado_en).toLocaleDateString('es-BO') }}</td>
              <td class="py-3 px-3">
                <div class="flex items-center gap-2">
                  <button class="text-xs text-primary-600 hover:underline" @click="verDetalle(p)">Ver</button>
                  <button class="text-xs text-green-600 hover:underline" @click="abrirWhatsApp(p)">WA</button>
                  <select
                    v-if="p.estado !== 'completado' && p.estado !== 'cancelado'"
                    :value="p.estado"
                    class="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    @change="cambiarEstado(p, ($event.target as HTMLSelectElement).value as EstadoPedido)"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="enviado">Enviado</option>
                    <option value="completado">✓ Completar</option>
                    <option value="cancelado">✗ Cancelar</option>
                  </select>
                  <span v-else class="text-xs text-gray-400 italic">{{ ESTADO_LABELS[p.estado] }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="pedidosFiltrados.length === 0">
              <td colspan="7" class="text-center py-10 text-gray-400">No hay pedidos.</td>
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
        <div v-if="detalle.pedido.metodo_pago" class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Método de pago:</span>
          <span class="font-medium text-blue-600 dark:text-blue-400">{{ METODO_LABELS[detalle.pedido.metodo_pago] }}</span>
        </div>
        <div v-if="detalle.pedido.referencia_pago" class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Referencia:</span>
          <span class="font-mono text-xs">{{ detalle.pedido.referencia_pago }}</span>
        </div>
        <div class="space-y-2 pt-1">
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
        <!-- Acción rápida: confirmar pago desde detalle -->
        <div v-if="detalle.pedido.estado === 'enviado'" class="pt-2">
          <BaseButton class="w-full justify-center" @click="cambiarEstado(detalle.pedido, 'completado')">
            Confirmar pago recibido
          </BaseButton>
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

    <!-- Modal confirmar pago pedido existente -->
    <BaseModal :open="showPago" title="Confirmar pago" @close="showPago = false">
      <div v-if="pedidoPago" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Pedido <strong>#{{ pedidoPago.id_pedido.slice(-6).toUpperCase() }}</strong> —
          Total: <strong class="text-primary-600">Bs {{ Number(pedidoPago.total).toFixed(2) }}</strong>
        </p>

        <!-- Método que eligió el cliente (si aplica) -->
        <div v-if="pedidoPago.metodo_pago" class="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
          El cliente indicó pagar con <strong>{{ METODO_LABELS[pedidoPago.metodo_pago] }}</strong>
          <span v-if="pedidoPago.referencia_pago"> · Ref: {{ pedidoPago.referencia_pago }}</span>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método de pago recibido *</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="m in METODOS" :key="m.v"
              :class="[
                'py-2 px-3 rounded-xl border text-sm font-medium transition',
                metodoPago === m.v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ]"
              @click="metodoPago = m.v"
            >{{ m.l }}</button>
          </div>
        </div>

        <div v-if="metodoPago !== 'efectivo'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia (opcional)</label>
          <input v-model="referenciaPago" type="text" placeholder="Nro. de transacción o código" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <p class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          Este pago se registrará en la caja del día de hoy.
        </p>

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showPago = false">Cancelar</BaseButton>
          <BaseButton @click="confirmarPago">Confirmar y registrar en caja</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal nueva venta desde recepción -->
    <BaseModal :open="showNuevo" title="Registrar venta" size="lg" @close="cerrarNuevo">
      <div class="space-y-4">

        <!-- Buscar productos -->
        <input v-model="buscarProd" type="text" placeholder="Buscar producto..." class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

        <div class="max-h-44 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg divide-y divide-gray-50 dark:divide-gray-800">
          <div
            v-for="p in productosFiltrados" :key="p.id_producto"
            class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            @click="agregarRec(p)"
          >
            <div>
              <p class="text-sm text-gray-900 dark:text-white">{{ p.nombre }}</p>
              <p class="text-xs text-gray-500">Bs {{ Number(p.precio).toFixed(2) }} · Stock: {{ p.stock }}</p>
            </div>
            <span class="text-primary-600 text-xl font-bold leading-none">+</span>
          </div>
          <div v-if="productosFiltrados.length === 0" class="py-6 text-center text-xs text-gray-400">Sin productos</div>
        </div>

        <!-- Carrito recepción -->
        <div v-if="carritoRec.length" class="border border-gray-100 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <div v-for="i in carritoRec" :key="i.idProducto" class="flex items-center gap-2 text-sm">
            <span class="flex-1 text-gray-900 dark:text-white">{{ i.nombre }}</span>
            <span class="text-gray-500">× {{ i.cantidad }}</span>
            <span class="text-primary-600 font-semibold">Bs {{ (Number(i.precio) * i.cantidad).toFixed(2) }}</span>
            <button class="text-red-400 hover:text-red-600 text-base leading-none" @click="quitarRec(i.idProducto)">×</button>
          </div>
          <div class="flex justify-between font-bold pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
            <span>Total</span>
            <span class="text-primary-600">Bs {{ totalRec.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Notas -->
        <textarea v-model="notasRec" rows="1" placeholder="Notas (opcional)" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

        <!-- Método de pago -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método de pago *</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="m in METODOS" :key="m.v"
              :class="[
                'py-2 px-3 rounded-xl border text-sm font-medium transition',
                metodoNuevo === m.v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ]"
              @click="metodoNuevo = m.v"
            >{{ m.l }}</button>
          </div>
        </div>

        <div v-if="metodoNuevo !== 'efectivo'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia (opcional)</label>
          <input v-model="referenciaNew" type="text" placeholder="Nro. de transacción o código" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <!-- Toggle: venta directa o guardar como borrador -->
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div
            :class="[
              'relative w-10 h-5 rounded-full transition',
              ventaDirecta ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
            ]"
            @click="ventaDirecta = !ventaDirecta"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                ventaDirecta ? 'translate-x-5' : '',
              ]"
            />
          </div>
          <span class="text-sm text-gray-700 dark:text-gray-300">
            <span v-if="ventaDirecta" class="font-medium text-primary-600 dark:text-primary-400">Registrar en caja ahora</span>
            <span v-else class="text-gray-500">Solo guardar pedido (completar después)</span>
          </span>
        </label>

        <p v-if="ventaDirecta" class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          La venta se registrará como completada y aparecerá en la caja del día de hoy.
        </p>

        <div class="flex justify-end gap-3 pt-1">
          <BaseButton variant="secondary" @click="cerrarNuevo">Cancelar</BaseButton>
          <BaseButton :disabled="!carritoRec.length" @click="confirmarNuevo">
            {{ ventaDirecta ? 'Registrar venta en caja' : 'Guardar pedido' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
