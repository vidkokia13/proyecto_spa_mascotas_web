import { ROLES, ADMIN_ROLES, type Role } from '@/shared/constants/roles'

export interface Permission {
  canViewAdminDashboard: boolean
  canManageUsers: boolean
  canViewLogs: boolean
  canViewEmployeeDashboard: boolean
  canViewClientProfile: boolean
  canCreateInternalUsers: boolean
  canUpdateEmployee: boolean
  canToggleUserStatus: boolean
}

const PERMISSION_MAP: Record<string, Permission> = {
  [ROLES.ADMIN]: {
    canViewAdminDashboard:   true,
    canManageUsers:          true,
    canViewLogs:             true,
    canViewEmployeeDashboard: false,
    canViewClientProfile:    false,
    canCreateInternalUsers:  true,
    canUpdateEmployee:       true,
    canToggleUserStatus:     true,
  },
  [ROLES.JEFE]: {
    canViewAdminDashboard:   true,
    canManageUsers:          true,
    canViewLogs:             true,
    canViewEmployeeDashboard: false,
    canViewClientProfile:    false,
    canCreateInternalUsers:  true,
    canUpdateEmployee:       true,
    canToggleUserStatus:     true,
  },
  [ROLES.TRABAJADOR]: {
    canViewAdminDashboard:   false,
    canManageUsers:          false,
    canViewLogs:             false,
    canViewEmployeeDashboard: true,
    canViewClientProfile:    false,
    canCreateInternalUsers:  false,
    canUpdateEmployee:       false,
    canToggleUserStatus:     false,
  },
  [ROLES.CLIENTE]: {
    canViewAdminDashboard:   false,
    canManageUsers:          false,
    canViewLogs:             false,
    canViewEmployeeDashboard: false,
    canViewClientProfile:    true,
    canCreateInternalUsers:  false,
    canUpdateEmployee:       false,
    canToggleUserStatus:     false,
  },
}

export function getPermissions(role: Role | string): Permission {
  return PERMISSION_MAP[role] ?? PERMISSION_MAP[ROLES.CLIENTE]
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as Role)
}

export function hasPermission(role: string, permission: keyof Permission): boolean {
  return getPermissions(role)[permission]
}
