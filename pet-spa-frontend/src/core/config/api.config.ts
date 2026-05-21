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
  MASCOTAS: {
    BASE:  '/mascotas',
    BY_ID: (id: string) => `/mascotas/${id}`,
  },
  SERVICIOS: {
    BASE:  '/servicios',
    BY_ID: (id: string) => `/servicios/${id}`,
  },
  HORARIOS: {
    BASE:              '/horarios',
    TOGGLE:            (dia: number) => `/horarios/${dia}`,
    GROOMERS:          '/horarios/groomers',
    GROOMER_BY_ID:     (id: string) => `/horarios/groomers/${id}`,
    GROOMER_REMOVE_DIA:(id: string, dia: number) => `/horarios/groomers/${id}/dia/${dia}`,
  },
  AGENDA: {
    SLOTS:       '/agenda/slots',
    BLOQUEOS:    '/agenda/bloqueos',
    BLOQUEO_ID:  (id: string) => `/agenda/bloqueos/${id}`,
  },
  CITAS: {
    BASE:      '/citas',
    MIS_CITAS: '/citas/mis-citas',
    BY_ID:     (id: string) => `/citas/${id}`,
    ESTADO:    (id: string) => `/citas/${id}/estado`,
  },
  HEALTH: '/health',
} as const
