<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authRepository } from '@/data/repositories/AuthRepository.impl'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { extractErrorMessage } from '@/core/errors/AppError'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'

const authStore = useAuthStore()

const qrDataUrl     = ref<string | null>(null)
const secret        = ref('')
const code          = ref('')
const step          = ref<'idle' | 'scan' | 'done'>('idle')
const loading       = ref(false)
const verifyLoading = ref(false)
const error         = ref('')
const successMsg    = ref('')

const twoFaEnabled = ref(authStore.profile?.two_factor_enabled ?? false)

onMounted(async () => {
  await authStore.fetchProfile()
  twoFaEnabled.value = authStore.profile?.two_factor_enabled ?? false
})

async function startSetup() {
  loading.value = true
  error.value   = ''
  try {
    const res  = await authRepository.setup2FA()
    qrDataUrl.value = res.qrDataUrl
    secret.value    = res.secret
    step.value      = 'scan'
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  if (code.value.length !== 6 || verifyLoading.value) return
  verifyLoading.value = true
  error.value         = ''
  try {
    await authRepository.verifySetup2FA(code.value)
    twoFaEnabled.value  = true
    step.value          = 'done'
    successMsg.value    = '2FA activado. A partir de ahora cada login pedirá el código.'
    await authStore.fetchProfile()
  } catch (e) {
    error.value = extractErrorMessage(e)
    code.value  = ''
  } finally {
    verifyLoading.value = false
  }
}

async function disable() {
  if (!confirm('¿Desactivar la autenticación en dos pasos?')) return
  loading.value = true
  error.value   = ''
  try {
    await authRepository.disable2FA()
    twoFaEnabled.value = false
    qrDataUrl.value    = null
    secret.value       = ''
    step.value         = 'idle'
    successMsg.value   = '2FA desactivado.'
    await authStore.fetchProfile()
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Seguridad — Autenticación en dos pasos</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
        Protegé tu cuenta con Google Authenticator, Authy u otra app TOTP.
      </p>
    </div>

    <BaseCard>
      <!-- Estado actual -->
      <div class="flex items-center gap-3 mb-6">
        <div :class="['w-3 h-3 rounded-full', twoFaEnabled ? 'bg-green-500' : 'bg-gray-300']" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          2FA {{ twoFaEnabled ? 'activado' : 'desactivado' }}
        </span>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
        {{ error }}
      </div>

      <div v-if="successMsg" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
        {{ successMsg }}
      </div>

      <!-- Paso: idle (no activado) -->
      <div v-if="!twoFaEnabled && step === 'idle'">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Al activar 2FA, cada vez que inicies sesión se te pedirá un código de tu app de autenticación además de la contraseña.
        </p>
        <BaseButton :loading="loading" @click="startSetup">
          Configurar 2FA
        </BaseButton>
      </div>

      <!-- Paso: escanear QR -->
      <div v-else-if="step === 'scan'" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          1. Abrí tu app de autenticación (Google Authenticator, Authy…)<br>
          2. Escaneá este código QR:
        </p>
        <div class="flex justify-center">
          <img :src="qrDataUrl!" alt="QR 2FA" class="w-48 h-48 border-4 border-white rounded-lg shadow-md" />
        </div>
        <details class="text-xs text-gray-400">
          <summary class="cursor-pointer">Ver clave manual</summary>
          <code class="block mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">{{ secret }}</code>
        </details>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          3. Ingresá el código de 6 dígitos para confirmar:
        </p>
        <div class="flex gap-3">
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="flex-1 text-center text-xl tracking-widest rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <BaseButton :loading="verifyLoading" :disabled="code.length !== 6" @click="verifyCode">
            Verificar
          </BaseButton>
        </div>
      </div>

      <!-- Paso: listo -->
      <div v-else-if="step === 'done'" class="text-center py-2">
        <svg class="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-semibold text-gray-900 dark:text-white">2FA configurado correctamente</p>
      </div>

      <!-- Ya activo: opción de desactivar -->
      <div v-if="twoFaEnabled && step !== 'scan'" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <BaseButton variant="danger" :loading="loading" @click="disable">
          Desactivar 2FA
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
