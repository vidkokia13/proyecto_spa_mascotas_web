<script setup lang="ts">
import { useUiStore } from '@/presentation/stores/ui.store'
import { useAuthStore } from '@/presentation/stores/auth.store'

defineProps<{ title?: string }>()

const uiStore   = useUiStore()
const authStore = useAuthStore()
</script>

<template>
  <header class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        @click="uiStore.toggleSidebar"
      >
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h2 v-if="title" class="font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
        {{ authStore.user?.nombre }}
      </span>
      <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {{ authStore.user?.nombre?.charAt(0).toUpperCase() }}
      </div>
    </div>
  </header>
</template>
