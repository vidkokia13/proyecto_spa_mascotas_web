export const ROLES = {
  ADMIN:      'admin',
  JEFE:       'jefe',
  TRABAJADOR: 'trabajador',
  CLIENTE:    'cliente',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ADMIN_ROLES: Role[] = [ROLES.ADMIN, ROLES.JEFE]
export const WORKER_ROLES: Role[] = [ROLES.TRABAJADOR]
export const INTERNAL_ROLES: Role[] = [ROLES.ADMIN, ROLES.JEFE, ROLES.TRABAJADOR]

export const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrador',
  jefe:       'Jefe',
  trabajador: 'Empleado',
  cliente:    'Cliente',
}

export const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  jefe:       'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  trabajador: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cliente:    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const ESTADO_LABELS: Record<string, string> = {
  activo:   'Activo',
  inactivo: 'Inactivo',
  pendiente: 'Pendiente',
  bloqueado: 'Bloqueado',
}

export const ESTADO_COLORS: Record<string, string> = {
  activo:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactivo: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  bloqueado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}
