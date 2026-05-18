import { authDatasource } from '@/data/datasources/AuthDatasource'
import type {
  LoginPayload, RegisterPayload,
  LoginResult, RegisterResponse, MeResponse,
  TwoFactorSetupResponse,
} from '@/shared/types/auth.types'

export class AuthRepositoryImpl {
  login(payload: LoginPayload): Promise<LoginResult> {
    return authDatasource.login(payload)
  }
  register(payload: RegisterPayload): Promise<RegisterResponse> {
    return authDatasource.register(payload)
  }
  getMe(): Promise<MeResponse> {
    return authDatasource.getMe()
  }
  activate(token: string): Promise<{ message: string }> {
    return authDatasource.activate(token)
  }
  changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return authDatasource.changePassword(currentPassword, newPassword)
  }
  verify2FALogin(two_factor_token: string, code: string): Promise<LoginResult> {
    return authDatasource.verify2FALogin(two_factor_token, code)
  }
  setup2FA(): Promise<TwoFactorSetupResponse> {
    return authDatasource.setup2FA()
  }
  verifySetup2FA(code: string): Promise<{ message: string }> {
    return authDatasource.verifySetup2FA(code)
  }
  disable2FA(): Promise<{ message: string }> {
    return authDatasource.disable2FA()
  }
}

export const authRepository = new AuthRepositoryImpl()
