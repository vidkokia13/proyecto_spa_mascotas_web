import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/presentation/stores/auth.store'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import type { Role } from '@/shared/constants/roles'

export function roleGuard(allowedRoles: Role[]) {
  return (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): void => {
    const authStore = useAuthStore()
    const role = authStore.userRole as Role | null

    if (!role || !allowedRoles.includes(role)) {
      next({ name: ROUTE_NAMES.FORBIDDEN })
      return
    }
    next()
  }
}
