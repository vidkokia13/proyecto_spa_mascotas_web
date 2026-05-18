<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuth } from '@/presentation/composables/useAuth'
import { extractErrorMessage } from '@/core/errors/AppError'
import { isPasswordValid } from '@/core/security/password.validator'
import BaseInput              from '@/presentation/components/ui/BaseInput.vue'
import BaseButton             from '@/presentation/components/ui/BaseButton.vue'
import PasswordStrengthMeter  from '@/presentation/components/ui/PasswordStrengthMeter.vue'
import { ROUTE_NAMES } from '@/shared/constants/routes'

const { register } = useAuth()

const form = reactive({
  nombre:              '',
  email:               '',
  password:            '',
  confirmPassword:     '',
  telefono:            '',
  ci:                  '',
  direccion:           '',
  canalNotificacion:   'email' as 'email' | 'whatsapp' | 'sms',
})

const showPassword        = ref(false)
const showConfirmPassword = ref(false)
const error               = ref('')
const loading             = ref(false)
const success             = ref('')

const passwordMismatch = computed(() =>
  form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
)

const canSubmit = computed(() =>
  form.nombre.trim().length >= 2 &&
  form.email.trim().length > 0 &&
  isPasswordValid(form.password) &&
  form.password === form.confirmPassword,
)

async function submit() {
  if (!canSubmit.value || loading.value) return
  error.value   = ''
  loading.value = true
  try {
    await register({
      nombre:            form.nombre.trim(),
      email:             form.email.trim().toLowerCase(),
      password:          form.password,
      telefono:          form.telefono || null,
      ci:                form.ci || null,
      direccion:         form.direccion || null,
      canalNotificacion: form.canalNotificacion,
    })
    success.value = 'Cuenta creada. Revisá tu correo para activarla.'
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Crear cuenta</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Solo para clientes. El personal es creado por un administrador.</p>

    <div v-if="success" class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
      {{ success }}
      <div class="mt-2">
        <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="font-medium underline">Iniciar sesión</RouterLink>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
      {{ error }}
    </div>

    <form v-if="!success" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.nombre" label="Nombre completo" placeholder="Juan Pérez" required :disabled="loading" />
      <BaseInput v-model="form.email" label="Email" type="email" placeholder="tu@email.com" required :disabled="loading" />

      <div>
        <div class="relative">
          <BaseInput
            v-model="form.password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
          <button type="button" class="absolute right-3 top-[34px] text-gray-400" @click="showPassword = !showPassword">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        <PasswordStrengthMeter :password="form.password" />
      </div>

      <div class="relative">
        <BaseInput
          v-model="form.confirmPassword"
          label="Confirmar contraseña"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="••••••••"
          :error="passwordMismatch ? 'Las contraseñas no coinciden' : ''"
          required
          :disabled="loading"
        />
        <button type="button" class="absolute right-3 top-[34px] text-gray-400" @click="showConfirmPassword = !showConfirmPassword">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.telefono" label="Teléfono" placeholder="+598 99 000 000" :disabled="loading" />
        <BaseInput v-model="form.ci" label="CI" placeholder="12345678" :disabled="loading" />
      </div>

      <BaseInput v-model="form.direccion" label="Dirección" placeholder="Calle 123, Montevideo" :disabled="loading" />

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Canal de notificación</label>
        <select
          v-model="form.canalNotificacion"
          class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <BaseButton type="submit" :loading="loading" :disabled="!canSubmit" full-width>
        Crear cuenta
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      ¿Ya tenés cuenta?
      <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">
        Iniciar sesión
      </RouterLink>
    </p>
  </div>
</template>
