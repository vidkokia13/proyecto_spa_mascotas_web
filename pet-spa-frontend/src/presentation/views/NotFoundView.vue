<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'

const router = useRouter()
</script>

<template>
  <div class="text-center">
    <div class="text-8xl font-black text-gray-200 dark:text-gray-800 mb-4">404</div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página no encontrada</h2>
    <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">La ruta que buscás no existe.</p>
    <BaseButton @click="router.push('/')">Volver al inicio</BaseButton>
  </div>
</template>
