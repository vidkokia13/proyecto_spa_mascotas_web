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

  CLIENT_PROFILE: 'client-profile',
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

  CLIENT_PROFILE: '/profile',
} as const
