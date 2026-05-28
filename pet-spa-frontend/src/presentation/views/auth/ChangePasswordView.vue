<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { authRepository } from '@/data/repositories/AuthRepository.impl'
import { extractErrorMessage } from '@/core/errors/AppError'
import { isPasswordValid } from '@/core/security/password.validator'
import BaseInput              from '@/presentation/components/ui/BaseInput.vue'
import BaseButton             from '@/presentation/components/ui/BaseButton.vue'
import BaseCard               from '@/presentation/components/ui/BaseCard.vue'
import PasswordStrengthMeter  from '@/presentation/components/ui/PasswordStrengthMeter.vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/presentation/stores/ui.store'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const uiStore   = useUiStore()
const authStore = useAuthStore()
const router    = useRouter()

const form = reactive({
  currentPassword: '',
  newPassword:     '',
  confirmPassword: '',
})

const loading = ref(false)
const error   = ref('')
const success = ref(false)

const mismatch = computed(() =>
  form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword,
)

const canSubmit = computed(() =>
  form.currentPassword.length > 0 &&
  isPasswordValid(form.newPassword) &&
  form.newPassword === form.confirmPassword,
)

async function submit() {
  if (!canSubmit.value || loading.value) return
  error.value   = ''
  loading.value = true
  try {
    await authRepository.changePassword(form.currentPassword, form.newPassword)
    success.value = true
    authStore.mustChangePassword = false
    uiStore.showToast('Contraseña actualizada correctamente', 'success')
    form.currentPassword = ''
    form.newPassword     = ''
    form.confirmPassword = ''
    // Redirigir al panel correspondiente tras 1.5 s
    setTimeout(() => {
      const role = authStore.userRole
      if (role === 'admin' || role === 'jefe') router.push({ name: ROUTE_NAMES.ADMIN_DASHBOARD })
      else if (role === 'trabajador') router.push({ name: ROUTE_NAMES.EMPLOYEE_DASHBOARD })
      else if (role === 'recepcion') router.push({ name: ROUTE_NAMES.RECEPCION_DASHBOARD })
      else router.push({ name: ROUTE_NAMES.CLIENT_PROFILE })
    }, 1500)
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cambiar contraseña</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Ingresá tu contraseña actual y la nueva.</p>
    </div>

    <!-- Banner: cambio forzado por admin -->
    <div
      v-if="authStore.mustChangePassword"
      class="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3"
    >
      <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p class="font-semibold text-amber-800 dark:text-amber-300 text-sm">Contraseña temporal detectada</p>
        <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          El administrador asignó una contraseña temporal. Debés cambiarla antes de continuar.
        </p>
      </div>
    </div>

    <BaseCard>
      <div v-if="success" class="text-center py-4">
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="font-semibold text-gray-900 dark:text-white">Contraseña actualizada</p>
        <p class="text-sm text-gray-500 mt-1">La próxima vez que inicies sesión usá la nueva contraseña.</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {{ error }}
        </div>

        <BaseInput
          v-model="form.currentPassword"
          label="Contraseña actual"
          type="password"
          placeholder="••••••••"
          required
          :disabled="loading"
        />

        <div>
          <BaseInput
            v-model="form.newPassword"
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
          <PasswordStrengthMeter :password="form.newPassword" />
        </div>

        <BaseInput
          v-model="form.confirmPassword"
          label="Confirmar nueva contraseña"
          type="password"
          placeholder="••••••••"
          :error="mismatch ? 'Las contraseñas no coinciden' : ''"
          required
          :disabled="loading"
        />

        <BaseButton type="submit" :loading="loading" :disabled="!canSubmit" full-width>
          Actualizar contraseña
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>
