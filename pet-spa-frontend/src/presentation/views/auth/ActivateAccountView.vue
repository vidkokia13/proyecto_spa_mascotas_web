<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authRepository } from '@/data/repositories/AuthRepository.impl'
import { extractErrorMessage } from '@/core/errors/AppError'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const route   = useRoute()
const loading = ref(true)
const success = ref(false)
const error   = ref('')

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    error.value   = 'Token de activación no encontrado.'
    loading.value = false
    return
  }
  try {
    await authRepository.activate(token)
    success.value = true
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="text-center">
    <div v-if="loading" class="flex flex-col items-center gap-3">
      <svg class="animate-spin h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="text-gray-600 dark:text-gray-400">Activando cuenta…</p>
    </div>

    <div v-else-if="success">
      <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Cuenta activada!</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Tu cuenta fue activada correctamente. Ya podés iniciar sesión.</p>
      <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }">
        <BaseButton>Iniciar sesión</BaseButton>
      </RouterLink>
    </div>

    <div v-else>
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Error de activación</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ error }}</p>
      <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }">
        <BaseButton variant="secondary">Volver al login</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>
