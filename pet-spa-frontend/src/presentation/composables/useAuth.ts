import { useAuthStore } from '@/presentation/stores/auth.store'
import { useUiStore } from '@/presentation/stores/ui.store'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import { ADMIN_ROLES, ROLES } from '@/shared/constants/roles'
import type { LoginPayload, RegisterPayload } from '@/shared/types/auth.types'
import type { Role } from '@/shared/constants/roles'

export function useAuth() {
  const authStore = useAuthStore()
  const uiStore   = useUiStore()
  const router    = useRouter()

  async function login(payload: LoginPayload): Promise<void> {
    await authStore.login(payload)
    // Si hay twoFactorToken, el store ya navegó a /2fa — no hacer nada más
    if (authStore.twoFactorToken) return
    uiStore.showToast('Bienvenido, ' + authStore.user?.nombre, 'success')
    redirectByRole(authStore.user?.rol)
  }

  async function register(payload: RegisterPayload): Promise<void> {
    const res = await authStore.register(payload)
    uiStore.showToast(res?.message ?? 'Cuenta creada', 'success')
    await router.push({ name: ROUTE_NAMES.LOGIN })
  }

  function logout(): void {
    authStore.logout()
    router.push({ name: ROUTE_NAMES.LOGIN })
  }

  function redirectByRole(rol?: Role | string | null): void {
    if (!rol) {
      router.push({ name: ROUTE_NAMES.LOGIN })
      return
    }
    if (ADMIN_ROLES.includes(rol as Role)) {
      router.push({ name: ROUTE_NAMES.ADMIN_DASHBOARD })
    } else if (rol === ROLES.TRABAJADOR) {
      router.push({ name: ROUTE_NAMES.EMPLOYEE_DASHBOARD })
    } else if (rol === ROLES.RECEPCION) {
      router.push({ name: ROUTE_NAMES.RECEPCION_DASHBOARD })
    } else {
      router.push({ name: ROUTE_NAMES.CLIENT_PROFILE })
    }
  }

  return {
    authStore,
    login,
    register,
    logout,
    redirectByRole,
  }
}
