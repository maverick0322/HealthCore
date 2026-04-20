import httpClient from '@/core/http/httpClient';
import type {
  AuthTokensResponse,
  CurrentUserResponse,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  PasswordResetRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyCodeRequest,
} from '../types/auth.types';

/**
 * Auth service — stateless functions that call the Identity Service API.
 *
 * Every function returns the response data directly (unwraps AxiosResponse).
 */

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokensResponse> {
    const res = await httpClient.post<AuthTokensResponse>('/auth/login', data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const res = await httpClient.post<RegisterResponse>('/auth/register', data);
    return res.data;
  },

  async verifyCode(data: VerifyCodeRequest): Promise<MessageResponse> {
    const res = await httpClient.post<MessageResponse>('/auth/verify-code', data);
    return res.data;
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<MessageResponse> {
    const res = await httpClient.post<MessageResponse>('/auth/password-reset/request', data);
    return res.data;
  },

  async confirmPasswordReset(data: ResetPasswordRequest): Promise<MessageResponse> {
    const res = await httpClient.post<MessageResponse>('/auth/password-reset/confirm', data);
    return res.data;
  },

  async refreshTokens(data: RefreshRequest): Promise<AuthTokensResponse> {
    const res = await httpClient.post<AuthTokensResponse>('/auth/refresh', data);
    return res.data;
  },

  async logout(data: LogoutRequest): Promise<MessageResponse> {
    const res = await httpClient.post<MessageResponse>('/auth/logout', data);
    return res.data;
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const res = await httpClient.get<CurrentUserResponse>('/auth/me');
    return res.data;
  },
};
