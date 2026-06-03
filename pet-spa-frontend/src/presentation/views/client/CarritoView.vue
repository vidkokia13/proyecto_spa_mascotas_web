<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePedidoStore } from '@/presentation/stores/pedido.store'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { MetodoPago } from '@/shared/types/agenda.types'

const store  = usePedidoStore()
const router = useRouter()

const notas         = ref('')
const metodoPago    = ref<MetodoPago | null>(null)
const referenciaPago = ref('')
const pedidoOk      = ref<{ id_pedido: string; total: number } | null>(null)
const copiado       = ref(false)

const METODOS: { v: MetodoPago; l: string; icon: string }[] = [
  { v: 'efectivo',       l: 'Efectivo',       icon: '💵' },
  { v: 'qr',            l: 'QR / Código QR',  icon: '📱' },
  { v: 'transferencia', l: 'Transferencia',    icon: '🏦' },
]

const totalCarrito = computed(() => store.totalCarrito())

// ── Compartir ─────────────────────────────────────────────────────────────────

function textoCarrito(): string {
  if (!store.carrito.length) return ''
  const lineas = store.carrito.map(i =>
    `• ${i.nombre} x${i.cantidad} = Bs ${(i.precio * i.cantidad).toFixed(2)}`,
  ).join('\n')
  return `🐾 *Pedido Pet Spa*\n\n${lineas}\n\n*Total: Bs ${totalCarrito.value.toFixed(2)}*`
}

function compartirWhatsApp() {
  const msg = encodeURIComponent(textoCarrito())
  window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener')
}

function compartirTelegram() {
  const msg = encodeURIComponent(textoCarrito())
  window.open(`https://t.me/share/url?url=&text=${msg}`, '_blank', 'noopener')
}

async function copiarCarrito() {
  await navigator.clipboard.writeText(textoCarrito())
  copiado.value = true
  setTimeout(() => { copiado.value = false }, 2000)
}

// ── Pedido ────────────────────────────────────────────────────────────────────

async function confirmarPedido() {
  if (!metodoPago.value) {
    alert('Por favor selecciona un método de pago.')
    return
  }
  try {
    const result = await store.confirmarPedido(
      notas.value || undefined,
      metodoPago.value,
      referenciaPago.value || undefined,
    )
    pedidoOk.value = { id_pedido: result.pedido.id_pedido, total: result.pedido.total }
    notas.value        = ''
    metodoPago.value   = null
    referenciaPago.value = ''
  } catch (e: any) {
    alert(e.message)
  }
}

function volverTienda() {
  router.push({ name: ROUTE_NAMES.CLIENT_TIENDA })
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <!-- Cabecera -->
    <div class="flex items-center gap-3">
      <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition" @click="volverTienda">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Carrito</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Revisa tu pedido antes de confirmar</p>
      </div>
    </div>

    <!-- Carrito vacío -->
    <div v-if="store.carrito.length === 0" class="text-center py-20 space-y-4">
      <svg class="w-16 h-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">Tu carrito está vacío</p>
      <BaseButton @click="volverTienda">Ir a la tienda</BaseButton>
    </div>

    <template v-else>
      <!-- Lista de ítems -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div
          v-for="item in store.carrito" :key="item.idProducto"
          class="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <img v-if="item.imagen_url" :src="item.imagen_url" class="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          <div v-else class="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" />

          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ item.nombre }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Bs {{ Number(item.precio).toFixed(2) }} c/u</p>
          </div>

          <!-- Controles cantidad -->
          <div class="flex items-center gap-2">
            <button
              class="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold transition flex items-center justify-center"
              @click="store.cambiarCantidad(item.idProducto, item.cantidad - 1)"
            >−</button>
            <span class="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ item.cantidad }}</span>
            <button
              class="w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition flex items-center justify-center"
              @click="store.agregarAlCarrito({ idProducto: item.idProducto, nombre: item.nombre, precio: item.precio, imagen_url: item.imagen_url })"
            >+</button>
          </div>

          <span class="text-sm font-bold text-primary-600 dark:text-primary-400 w-20 text-right">
            Bs {{ (Number(item.precio) * Number(item.cantidad)).toFixed(2) }}
          </span>

          <button class="text-red-400 hover:text-red-600 ml-1 transition" @click="store.quitarDelCarrito(item.idProducto)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Total -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <span class="font-semibold text-gray-700 dark:text-gray-300">Total del pedido</span>
        <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">Bs {{ totalCarrito.toFixed(2) }}</span>
      </div>

      <!-- Compartir -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Compartir carrito</p>
        <div class="flex flex-wrap gap-3">
          <!-- WhatsApp -->
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition"
            @click="compartirWhatsApp"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>

          <!-- Telegram -->
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
            @click="compartirTelegram"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Telegram
          </button>

          <!-- Copiar -->
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition"
            @click="copiarCarrito"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {{ copiado ? '¡Copiado!' : 'Copiar' }}
          </button>
        </div>
      </div>

      <!-- Método de pago + notas + confirmar -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">

        <!-- Método de pago -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método de pago <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="m in METODOS" :key="m.v"
              :class="[
                'py-2.5 px-2 rounded-xl border text-sm font-medium transition flex flex-col items-center gap-1',
                metodoPago === m.v
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              ]"
              @click="metodoPago = m.v"
            >
              <span class="text-lg">{{ m.icon }}</span>
              <span class="text-xs leading-tight text-center">{{ m.l }}</span>
            </button>
          </div>
        </div>

        <!-- Referencia (solo QR/transferencia) -->
        <div v-if="metodoPago && metodoPago !== 'efectivo'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia / Código de operación (opcional)</label>
          <input
            v-model="referenciaPago" type="text" placeholder="Nro. de transacción o código QR"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Notas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas del pedido (opcional)</label>
          <textarea
            v-model="notas" rows="2"
            placeholder="Ej: entregar en tienda, regalo, observaciones..."
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <BaseButton class="w-full justify-center" :disabled="store.loading || !metodoPago" @click="confirmarPedido">
          {{ store.loading ? 'Enviando pedido...' : 'Confirmar pedido' }}
        </BaseButton>
        <p class="text-xs text-center text-gray-400">
          Recepción verificará tu pago y procesará el pedido.
        </p>
      </div>
    </template>

    <!-- Modal pedido confirmado -->
    <BaseModal :open="!!pedidoOk" title="¡Pedido enviado!" @close="pedidoOk = null; volverTienda()">
      <div class="text-center space-y-4 py-4">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="font-semibold text-gray-900 dark:text-white">Pedido registrado</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Recepción lo procesará y confirmará el método de pago.
          </p>
          <p class="text-xs text-gray-400">Total: <strong>Bs {{ Number(pedidoOk?.total).toFixed(2) }}</strong></p>
        </div>
        <BaseButton @click="pedidoOk = null; volverTienda()">Aceptar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
