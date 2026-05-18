<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'

const authStore = useAuthStore()
const router    = useRouter()

const code    = ref('')
const error   = ref('')
const loading = ref(false)

onMounted(() => {
  if (!authStore.twoFactorToken) {
    router.replace({ name: ROUTE_NAMES.LOGIN })
  }
})

async function submit() {
  if (code.value.length !== 6 || loading.value) return
  error.value   = ''
  loading.value = true
  try {
    await authStore.completeTwoFactor(code.value)
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message ?? 'Código incorrecto.'
    code.value  = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl items-center justify-center mb-4">
          <svg class="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Verificación en dos pasos</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Ingresá el código de 6 dígitos de tu app de autenticación.
        </p>
      </div>

      <BaseCard>
        <form class="space-y-4" @submit.prevent="submit">
          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {{ error }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código 2FA</label>
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="000000"
              class="block w-full text-center text-2xl tracking-widest rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              :disabled="loading"
            />
          </div>

          <BaseButton
            type="submit"
            full-width
            :loading="loading"
            :disabled="code.length !== 6"
          >
            Verificar
          </BaseButton>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          <RouterLink :to="{ name: 'login' }" class="text-primary-600 dark:text-primary-400 hover:underline">
            Volver al inicio de sesión
          </RouterLink>
        </p>
      </BaseCard>
    </div>
  </div>
</template>
