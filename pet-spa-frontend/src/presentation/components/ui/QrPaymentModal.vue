<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import QRCode from 'qrcode'
import BaseModal  from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  open:      boolean
  monto:     number | string
  servicio?: string
  referencia?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel:  []
}>()

const qrDataUrl  = ref('')
const generating = ref(false)

const montoNum = computed(() => Number(props.monto) || 0)

const qrPayload = computed(() =>
  JSON.stringify({
    comercio:  'Pet Spa',
    servicio:  props.servicio ?? 'Servicio',
    monto:     montoNum.value.toFixed(2),
    moneda:    'PEN',
    ref:       props.referencia || `PSP-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }),
)

async function generateQr() {
  generating.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(qrPayload.value, {
      width:          240,
      margin:         2,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } finally {
    generating.value = false
  }
}

watch(() => props.open, (v) => { if (v) generateQr() })
</script>

<template>
  <BaseModal :open="open" title="Pago con QR" size="sm" @close="emit('cancel')">
    <div class="flex flex-col items-center gap-4">

      <!-- Monto destacado -->
      <div class="text-center">
        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto a cobrar</p>
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
          S/ {{ montoNum.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
        </p>
        <p v-if="servicio" class="text-sm text-gray-500 mt-0.5">{{ servicio }}</p>
      </div>

      <!-- QR -->
      <div class="p-3 bg-white rounded-xl shadow-inner border border-gray-200">
        <div v-if="generating" class="w-60 h-60 flex items-center justify-center text-gray-400 text-sm">
          Generando…
        </div>
        <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="QR de pago"
          class="w-60 h-60 block" />
      </div>

      <!-- Instrucción -->
      <p class="text-xs text-gray-500 text-center max-w-xs">
        Muestra este QR al cliente para que escanee con su app bancaria (Yape, Plin, BCP, etc.).
        Una vez recibido el pago, confirma aquí.
      </p>

      <!-- Botones -->
      <div class="flex gap-3 w-full pt-1">
        <BaseButton class="flex-1" @click="emit('confirm')">
          Confirmar pago recibido
        </BaseButton>
        <BaseButton variant="secondary" class="flex-1" @click="emit('cancel')">
          Cancelar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
