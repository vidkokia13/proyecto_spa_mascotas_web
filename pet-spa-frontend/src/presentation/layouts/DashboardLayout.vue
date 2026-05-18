<script setup lang="ts">
import Sidebar from '@/presentation/components/layout/Sidebar.vue'
import Navbar  from '@/presentation/components/layout/Navbar.vue'
import { useUiStore } from '@/presentation/stores/ui.store'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const uiStore = useUiStore()
const route   = useRoute()

const pageTitle = computed(() => route.meta.title as string | undefined)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar :title="pageTitle" />
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Toast -->
  <Transition name="slide-up">
    <div
      v-if="uiStore.toast"
      :class="[
        'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2',
        uiStore.toast.type === 'error'   ? 'bg-red-600'   :
        uiStore.toast.type === 'success' ? 'bg-green-600' : 'bg-gray-800',
      ]"
    >
      <svg v-if="uiStore.toast.type === 'success'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else-if="uiStore.toast.type === 'error'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {{ uiStore.toast.message }}
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(1rem); }
</style>
