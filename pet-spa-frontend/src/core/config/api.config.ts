export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api'

export const API_TIMEOUT = 15000

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER:             '/auth/register',
    LOGIN:                '/auth/login',
    ME:                   '/auth/me',
    ACTIVATE:             '/auth/activate',
    CHANGE_PASSWORD:      '/auth/change-password',
    RESEND_TOKEN:         '/auth/resend-activation',
    TWO_FACTOR_LOGIN:     '/auth/2fa/login',
    TWO_FACTOR_SETUP:     '/auth/2fa/setup',
    TWO_FACTOR_VERIFY_SETUP: '/auth/2fa/verify-setup',
    TWO_FACTOR_DISABLE:   '/auth/2fa',
  },
  EMPLOYEES: {
    BASE:  '/empleados',
    BY_ID: (id: string) => `/empleados/${id}`,
  },
  AUDIT: {
    LOGS: '/audit-log',
  },
  MASCOTAS: {
    BASE:   '/mascotas',
    BY_ID:  (id: string) => `/mascotas/${id}`,
    CARNET: (id: string) => `/mascotas/${id}/carnet`,
  },
  SERVICIOS: {
    BASE:  '/servicios',
    BY_ID: (id: string) => `/servicios/${id}`,
  },
  HORARIOS: {
    BASE:               '/horarios',
    TOGGLE:             (dia: number) => `/horarios/${dia}`,
    GROOMERS:           '/horarios/groomers',
    GROOMER_BY_ID:      (id: string) => `/horarios/groomers/${id}`,
    GROOMER_REMOVE_DIA: (id: string, dia: number) => `/horarios/groomers/${id}/dia/${dia}`,
  },
  AGENDA: {
    SLOTS:      '/agenda/slots',
    GROOMERS:   '/agenda/groomers',
    BLOQUEOS:   '/agenda/bloqueos',
    BLOQUEO_ID: (id: string) => `/agenda/bloqueos/${id}`,
  },
  CITAS: {
    BASE:        '/citas',
    MIS_CITAS:   '/citas/mis-citas',
    MI_AGENDA:   '/citas/mi-agenda',
    CALENDARIO:  '/citas/calendario',
    BY_ID:       (id: string) => `/citas/${id}`,
    ESTADO:      (id: string) => `/citas/${id}/estado`,
    REPROGRAMAR: (id: string) => `/citas/${id}/reprogramar`,
    CANCELAR:    (id: string) => `/citas/${id}/cancelar`,
    CERRAR:      (id: string) => `/citas/${id}/cerrar`,
  },
  PAGOS: {
    BASE:    '/pagos',
    BY_ID:   (id: string) => `/pagos/${id}`,
    BY_CITA: (id: string) => `/pagos/cita/${id}`,
    RECIBO:  (idCita: string) => `/pagos/recibo/${idCita}`,
  },
  FICHAS: {
    BASE:    '/fichas',
    BY_CITA: (id: string) => `/fichas/cita/${id}`,
  },
  CHECKLIST: {
    ITEMS:      '/checklist/items',
    ITEM_BY_ID: (id: string) => `/checklist/items/${id}`,
    BY_CITA:    (id: string) => `/checklist/cita/${id}`,
    TOGGLE:     (idCita: string, idItem: string) => `/checklist/cita/${idCita}/item/${idItem}`,
  },
  FOTOS: {
    BY_CITA: (id: string) => `/fotos/cita/${id}`,
    BY_ID:   (id: string) => `/fotos/${id}`,
  },
  INSUMOS: {
    BASE:               '/insumos',
    BY_ID:              (id: string) => `/insumos/${id}`,
    ALERTAS:            '/insumos/alertas',
    LOG:                '/insumos/log',
    PREDICCION:         '/insumos/prediccion',
    CITA_INSUMOS:       (idCita: string) => `/insumos/cita/${idCita}`,
    CITA_REGISTER:      '/insumos/cita',
    CITA_INSUMO_UPDATE: (id: string) => `/insumos/cita/${id}`,
  },
  PROMOCIONES: {
    BASE:      '/promociones',
    BY_ID:     (id: string) => `/promociones/${id}`,
    VERIFICAR: '/promociones/verificar',
  },
  CAJA: {
    RESUMEN:   '/caja/resumen',
    CERRAR:    '/caja/cerrar',
    REABRIR:   '/caja/reabrir',
    HISTORIAL: '/caja/historial',
  },
  PRODUCTOS: {
    BASE:    '/productos',
    BY_ID:   (id: string) => `/productos/${id}`,
    IMAGEN:  (id: string) => `/productos/${id}/imagen`,
  },
  PEDIDOS: {
    BASE:        '/pedidos',
    MIS_PEDIDOS: '/pedidos/mis-pedidos',
    BY_ID:       (id: string) => `/pedidos/${id}`,
    ESTADO:      (id: string) => `/pedidos/${id}/estado`,
    WHATSAPP:    (id: string) => `/pedidos/${id}/whatsapp`,
  },
  MASCOTAS_FOTO: {
    SUBIR:    (id: string) => `/mascotas/${id}/foto`,
    ELIMINAR: (id: string) => `/mascotas/${id}/foto`,
  },
  HEALTH: '/health',
} as const
