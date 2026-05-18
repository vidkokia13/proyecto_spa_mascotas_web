import type { LoginPayload, RegisterPayload, LoginResponse, RegisterResponse, MeResponse } from '@/shared/types/auth.types'

export interface IAuthRepository {
  login(payload: LoginPayload): Promise<LoginResponse>
  register(payload: RegisterPayload): Promise<RegisterResponse>
  getMe(): Promise<MeResponse>
  activate(token: string): Promise<{ message: string }>
  changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }>
}
