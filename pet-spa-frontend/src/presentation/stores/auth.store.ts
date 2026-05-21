import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authRepository } from '@/data/repositories/AuthRepository.impl'
import { tokenStorage } from '@/infrastructure/storage/token.storage'
import { extractErrorMessage } from '@/core/errors/AppError'
import { getPermissions, type Permission } from '@/core/permissions/permissions'
import { ADMIN_ROLES } from '@/shared/constants/roles'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { AuthUser, LoginPayload, RegisterPayload, UserProfile } from '@/shared/types/auth.types'
import type { Role } from '@/shared/constants/roles'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token              = ref<string | null>(tokenStorage.getToken())
  const user               = ref<AuthUser | null>(tokenStorage.getUser<AuthUser>())
  const profile            = ref<UserProfile | null>(null)
  const loading            = ref(false)
  const error              = ref<string | null>(null)
  const mustChangePassword = ref(false)
  const twoFactorToken     = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole        = computed(() => user.value?.rol ?? null)
  const isAdmin         = computed(() => user.value ? ADMIN_ROLES.includes(user.value.rol as Role) : false)
  const isWorker        = computed(() => user.value?.rol === 'trabajador')
  const isClient        = computed(() => user.value?.rol === 'cliente')
  const permissions     = computed<Permission | null>(() => user.value ? getPermissions(user.value.rol) : null)

  async function login(payload: LoginPayload): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res = await authRepository.login(payload)

      // 2FA challenge
      if ('requires_2fa' in res && res.requires_2fa) {
        twoFactorToken.value = res.two_factor_token
        await router.push({ name: ROUTE_NAMES.TWO_FACTOR })
        return
      }

      // Normal login
      const loginRes = res as import('@/shared/types/auth.types').LoginResponse
      token.value = loginRes.token
      user.value  = loginRes.user
      tokenStorage.setToken(loginRes.token)
      tokenStorage.setUser(loginRes.user)

      if (loginRes.force_password_change) {
        mustChangePassword.value = true
        await router.push({ name: ROUTE_NAMES.CHANGE_PASSWORD })
        return
      }

      mustChangePassword.value = false
      _redirectByRole(loginRes.user.rol)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeTwoFactor(code: string): Promise<void> {
    if (!twoFactorToken.value) throw new Error('Sin token 2FA')
    loading.value = true
    error.value   = null
    try {
      const res = await authRepository.verify2FALogin(twoFactorToken.value, code)
      if ('requires_2fa' in res) throw new Error('Respuesta inesperada')

      twoFactorToken.value = null
      token.value = res.token
      user.value  = res.user
      tokenStorage.setToken(res.token)
      tokenStorage.setUser(res.user)

      if (res.force_password_change) {
        mustChangePassword.value = true
        await router.push({ name: ROUTE_NAMES.CHANGE_PASSWORD })
        return
      }

      mustChangePassword.value = false
      _redirectByRole(res.user.rol)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<{ message: string }> {
    loading.value = true
    error.value   = null
    try {
      return await authRepository.register(payload)
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile(): Promise<void> {
    if (!token.value) return
    try {
      const res = await authRepository.getMe()
      profile.value = res.user
      user.value = {
        id_usuario:    res.user.id_usuario,
        nombre:        res.user.nombre,
        email:         res.user.email,
        rol:           res.user.rol,
        id_cliente:    res.user.id_cliente,
        id_trabajador: res.user.id_trabajador,
      }
      mustChangePassword.value = res.user.force_password_change ?? false
      tokenStorage.setUser(user.value)
    } catch {
      logout()
    }
  }

  function logout(): void {
    token.value              = null
    user.value               = null
    profile.value            = null
    mustChangePassword.value = false
    twoFactorToken.value     = null
    tokenStorage.clear()
    router.push({ name: ROUTE_NAMES.LOGIN })
  }

  function clearError(): void {
    error.value = null
  }

  function _redirectByRole(role: string): void {
    if (role === 'admin' || role === 'jefe') {
      router.push({ name: ROUTE_NAMES.ADMIN_DASHBOARD })
    } else if (role === 'trabajador') {
      router.push({ name: ROUTE_NAMES.EMPLOYEE_DASHBOARD })
    } else if (role === 'recepcion') {
      router.push({ name: ROUTE_NAMES.RECEPCION_DASHBOARD })
    } else {
      router.push({ name: ROUTE_NAMES.CLIENT_PROFILE })
    }
  }

  return {
    token, user, profile, loading, error,
    mustChangePassword, twoFactorToken,
    isAuthenticated, userRole, isAdmin, isWorker, isClient, permissions,
    login, completeTwoFactor, register, fetchProfile, logout, clearError,
  }
})
