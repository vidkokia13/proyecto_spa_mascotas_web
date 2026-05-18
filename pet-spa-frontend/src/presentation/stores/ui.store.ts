import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen   = ref(true)
  const globalLoading = ref(false)
  const toast         = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 4000)
  }

  function setGlobalLoading(val: boolean): void {
    globalLoading.value = val
  }

  return { sidebarOpen, globalLoading, toast, toggleSidebar, showToast, setGlobalLoading }
})
