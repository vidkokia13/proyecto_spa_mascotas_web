<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuth } from '@/presentation/composables/useAuth'
import { extractErrorMessage } from '@/core/errors/AppError'
import BaseInput   from '@/presentation/components/ui/BaseInput.vue'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const error        = ref('')
const loading      = ref(false)
const attempts     = ref(0)

async function submit() {
  if (loading.value) return
  error.value   = ''
  loading.value = true
  try {
    await login({ email: form.email, password: form.password })
  } catch (e) {
    attempts.value++
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Ingresá tus credenciales para continuar</p>

    <div
      v-if="attempts >= 3"
      class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300"
    >
      Múltiples intentos fallidos. Tu cuenta podría bloquearse.
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        required
        :disabled="loading"
      />

      <div class="relative">
        <BaseInput
          v-model="form.password"
          label="Contraseña"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          required
          :disabled="loading"
        />
        <button
          type="button"
          class="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="showPassword = !showPassword"
        >
          <svg v-if="showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <BaseButton type="submit" :loading="loading" full-width>
        Ingresar
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      ¿No tenés cuenta?
      <RouterLink :to="{ name: ROUTE_NAMES.REGISTER }" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">
        Registrarse
      </RouterLink>
    </p>
  </div>
</template>
