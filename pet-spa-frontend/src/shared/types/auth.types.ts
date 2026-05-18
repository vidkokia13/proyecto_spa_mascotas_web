import type { Role } from '@/shared/constants/roles'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  nombre: string
  email: string
  password: string
  telefono?: string | null
  ci?: string | null
  direccion?: string | null
  canalNotificacion?: 'email' | 'whatsapp' | 'sms'
  horariosPreferidos?: string | null
}

export interface AuthUser {
  id_usuario: string
  nombre: string
  email: string
  rol: Role
  id_cliente: string | null
  id_trabajador: string | null
}

export interface UserProfile extends AuthUser {
  id_rol: number
  estado: string
  two_factor_enabled: boolean
  force_password_change: boolean
  ultimo_acceso: string | null
}

export interface LoginResponse {
  token: string
  user: AuthUser
  force_password_change: boolean
}

export interface TwoFactorChallengeResponse {
  requires_2fa: true
  two_factor_token: string
}

export type LoginResult = LoginResponse | TwoFactorChallengeResponse

export interface RegisterResponse {
  message: string
  user: {
    id_usuario: string
    id_cliente: string
    nombre: string
    email: string
    estado: string
    rol: string
  }
}

export interface MeResponse {
  user: UserProfile
}

export interface TwoFactorSetupResponse {
  secret: string
  qrDataUrl: string
}
