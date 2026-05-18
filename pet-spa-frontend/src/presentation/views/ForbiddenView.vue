<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/presentation/stores/auth.store'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'

const router    = useRouter()
const authStore = useAuthStore()

function goBack() {
  if (authStore.isAuthenticated) router.go(-1)
  else router.push('/login')
}
</script>

<template>
  <div class="text-center">
    <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
      <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    </div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso denegado</h2>
    <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">No tenés permisos para acceder a esta sección.</p>
    <BaseButton @click="goBack">Volver</BaseButton>
  </div>
</template>
