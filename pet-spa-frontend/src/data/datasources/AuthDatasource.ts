import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type {
  LoginPayload, RegisterPayload,
  LoginResult, RegisterResponse, MeResponse,
  TwoFactorSetupResponse,
} from '@/shared/types/auth.types'

export const authDatasource = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const { data } = await http.post<LoginResult>(API_ENDPOINTS.AUTH.LOGIN, payload)
    return data
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await http.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, payload)
    return data
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await http.get<MeResponse>(API_ENDPOINTS.AUTH.ME)
    return data
  },

  async activate(token: string): Promise<{ message: string }> {
    const { data } = await http.get<{ message: string }>(API_ENDPOINTS.AUTH.ACTIVATE, {
      params: { token },
    })
    return data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await http.patch<{ message: string }>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    })
    return data
  },

  async verify2FALogin(two_factor_token: string, code: string): Promise<LoginResult> {
    const { data } = await http.post<LoginResult>(API_ENDPOINTS.AUTH.TWO_FACTOR_LOGIN, {
      two_factor_token,
      code,
    })
    return data
  },

  async setup2FA(): Promise<TwoFactorSetupResponse> {
    const { data } = await http.post<TwoFactorSetupResponse>(API_ENDPOINTS.AUTH.TWO_FACTOR_SETUP)
    return data
  },

  async verifySetup2FA(code: string): Promise<{ message: string }> {
    const { data } = await http.post<{ message: string }>(API_ENDPOINTS.AUTH.TWO_FACTOR_VERIFY_SETUP, { code })
    return data
  },

  async disable2FA(): Promise<{ message: string }> {
    const { data } = await http.delete<{ message: string }>(API_ENDPOINTS.AUTH.TWO_FACTOR_DISABLE)
    return data
  },
}
