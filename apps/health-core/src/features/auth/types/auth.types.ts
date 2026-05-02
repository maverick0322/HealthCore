/* ──────────────────────────────────────────────────────────────
 * Identity Service — Request / Response types
 * Mirrors the OpenAPI specification for identity-service.
 * ────────────────────────────────────────────────────────────── */

// ── Enums ────────────────────────────────────────────────────

export type UserRole = 'PATIENT' | 'NUTRITIONIST' | 'ADMIN';

export type AuthProvider = 'LOCAL' | 'AUTH0' | 'GOOGLE' | 'FACEBOOK';

// ── Requests ─────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: UserRole;
  locale?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyCodeRequest {
  email: string;
  /** 6-digit numeric string */
  code: string;
}

export interface PasswordResetRequest {
  email: string;
  locale?: string;
}

export interface ResetPasswordRequest {
  email: string;
  /** 6-digit numeric string */
  code: string;
  newPassword: string;
  locale?: string;
}

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  locale?: string;
}

// ── Responses ────────────────────────────────────────────────

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresInMs: number;
  refreshTokenExpiresInMs: number;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface CurrentUserResponse {
  email: string;
  role: UserRole;
  provider: AuthProvider;
  emailVerified: boolean;
  enabled: boolean;
}
