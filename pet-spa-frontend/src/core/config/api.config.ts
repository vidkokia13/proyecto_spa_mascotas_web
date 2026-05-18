export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api'

export const API_TIMEOUT = 15000

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER:         '/auth/register',
    LOGIN:            '/auth/login',
    ME:               '/auth/me',
    ACTIVATE:         '/auth/activate',
    CHANGE_PASSWORD:  '/auth/change-password',
    RESEND_TOKEN:     '/auth/resend-activation',
    TWO_FACTOR_LOGIN: '/auth/2fa/login',
    TWO_FACTOR_SETUP: '/auth/2fa/setup',
    TWO_FACTOR_VERIFY_SETUP: '/auth/2fa/verify-setup',
    TWO_FACTOR_DISABLE: '/auth/2fa',
  },
  EMPLOYEES: {
    BASE:  '/empleados',
    BY_ID: (id: string) => `/empleados/${id}`,
  },
  AUDIT: {
    LOGS: '/audit-log',
  },
  HEALTH: '/health',
} as const
