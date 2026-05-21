export const ROUTE_NAMES = {
  LOGIN:           'login',
  REGISTER:        'register',
  ACTIVATE:        'activate',
  CHANGE_PASSWORD: 'change-password',
  TWO_FACTOR:      'two-factor',
  FORBIDDEN:       'forbidden',
  NOT_FOUND:       'not-found',

  ADMIN_DASHBOARD:   'admin-dashboard',
  ADMIN_USERS:       'admin-users',
  ADMIN_LOGS:        'admin-logs',
  ADMIN_2FA_SETUP:   'admin-2fa-setup',

  EMPLOYEE_DASHBOARD: 'employee-dashboard',
  EMPLOYEE_CITAS:     'employee-citas',

  RECEPCION_DASHBOARD: 'recepcion-dashboard',

  CLIENT_PROFILE:    'client-profile',
  CLIENT_MASCOTAS:   'client-mascotas',
  CLIENT_CITAS:      'client-citas',
  CLIENT_NUEVA_CITA: 'client-nueva-cita',

  AGENDA_CITAS:      'agenda-citas',
  AGENDA_HORARIOS:   'agenda-horarios',
  AGENDA_BLOQUEOS:   'agenda-bloqueos',
} as const

export const ROUTE_PATHS = {
  LOGIN:           '/login',
  REGISTER:        '/register',
  ACTIVATE:        '/activate',
  CHANGE_PASSWORD: '/change-password',
  TWO_FACTOR:      '/2fa',
  FORBIDDEN:       '/403',

  ADMIN_DASHBOARD:   '/admin/dashboard',
  ADMIN_USERS:       '/admin/users',
  ADMIN_LOGS:        '/admin/logs',
  ADMIN_2FA_SETUP:   '/admin/2fa-setup',

  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  EMPLOYEE_CITAS:     '/employee/citas',

  RECEPCION_DASHBOARD: '/recepcion/dashboard',

  CLIENT_PROFILE:    '/client/profile',
  CLIENT_MASCOTAS:   '/client/mascotas',
  CLIENT_CITAS:      '/client/citas',
  CLIENT_NUEVA_CITA: '/client/nueva-cita',

  AGENDA_CITAS:      '/agenda/citas',
  AGENDA_HORARIOS:   '/agenda/horarios',
  AGENDA_BLOQUEOS:   '/agenda/bloqueos',
} as const
