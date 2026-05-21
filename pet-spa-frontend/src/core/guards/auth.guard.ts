import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { ROUTE_NAMES } from '@/shared/constants/routes'

export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  const authStore = useAuthStore()

  const requiresAuth = to.meta.requiresAuth as boolean | undefined
  const guestOnly    = to.meta.guestOnly    as boolean | undefined

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } })
    return
  }

  if (guestOnly && authStore.isAuthenticated) {
    redirectByRole(authStore.userRole, next)
    return
  }

  // Forzar cambio de contraseña: solo puede ir a /change-password o hacer logout
  if (
    authStore.isAuthenticated &&
    authStore.mustChangePassword &&
    to.name !== ROUTE_NAMES.CHANGE_PASSWORD
  ) {
    next({ name: ROUTE_NAMES.CHANGE_PASSWORD })
    return
  }

  next()
}

function redirectByRole(role: string | null, next: NavigationGuardNext): void {
  if (!role) { next({ name: ROUTE_NAMES.LOGIN }); return }
  if (role === 'admin' || role === 'jefe') {
    next({ name: ROUTE_NAMES.ADMIN_DASHBOARD })
  } else if (role === 'trabajador') {
    next({ name: ROUTE_NAMES.EMPLOYEE_DASHBOARD })
  } else if (role === 'recepcion') {
    next({ name: ROUTE_NAMES.RECEPCION_DASHBOARD })
  } else {
    next({ name: ROUTE_NAMES.CLIENT_PROFILE })
  }
}
