import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import httpClient from '@/core/http/httpClient';

// Mock the httpClient
vi.mock('@/core/http/httpClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedPost = vi.mocked(httpClient.post);
const mockedGet = vi.mocked(httpClient.get);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── login ──────────────────────────────────────────────

  it('login calls POST /auth/login and returns data', async () => {
    const mockResponse = {
      data: {
        accessToken: 'at-123',
        refreshToken: 'rt-456',
        tokenType: 'Bearer',
        accessTokenExpiresInMs: 300000,
        refreshTokenExpiresInMs: 86400000,
      },
    };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'pass123',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'pass123',
    });
    expect(result.accessToken).toBe('at-123');
    expect(result.refreshToken).toBe('rt-456');
  });

  // ── register ───────────────────────────────────────────

  it('register calls POST /auth/register and returns data', async () => {
    const mockResponse = {
      data: {
        message: 'Verification code sent',
        email: 'new@example.com',
      },
    };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.register({
      email: 'new@example.com',
      password: 'pass123',
      role: 'PATIENT',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/register', {
      email: 'new@example.com',
      password: 'pass123',
      role: 'PATIENT',
    });
    expect(result.email).toBe('new@example.com');
  });

  // ── verifyCode ─────────────────────────────────────────

  it('verifyCode calls POST /auth/verify-code', async () => {
    const mockResponse = { data: { message: 'Email verified' } };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.verifyCode({
      email: 'test@example.com',
      code: '123456',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/verify-code', {
      email: 'test@example.com',
      code: '123456',
    });
    expect(result.message).toBe('Email verified');
  });

  // ── requestPasswordReset ───────────────────────────────

  it('requestPasswordReset calls POST /auth/password-reset/request', async () => {
    const mockResponse = { data: { message: 'Reset code sent' } };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.requestPasswordReset({
      email: 'test@example.com',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/password-reset/request', {
      email: 'test@example.com',
    });
    expect(result.message).toBe('Reset code sent');
  });

  // ── confirmPasswordReset ───────────────────────────────

  it('confirmPasswordReset calls POST /auth/password-reset/confirm', async () => {
    const mockResponse = { data: { message: 'Password updated' } };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.confirmPasswordReset({
      email: 'test@example.com',
      code: '123456',
      newPassword: 'newPass456',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/password-reset/confirm', {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'newPass456',
    });
    expect(result.message).toBe('Password updated');
  });

  // ── refreshTokens ─────────────────────────────────────

  it('refreshTokens calls POST /auth/refresh', async () => {
    const mockResponse = {
      data: {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        tokenType: 'Bearer',
        accessTokenExpiresInMs: 300000,
        refreshTokenExpiresInMs: 86400000,
      },
    };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.refreshTokens({
      refreshToken: 'old-rt',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/refresh', {
      refreshToken: 'old-rt',
    });
    expect(result.accessToken).toBe('new-at');
  });

  // ── logout ─────────────────────────────────────────────

  it('logout calls POST /auth/logout', async () => {
    const mockResponse = { data: { message: 'Logged out' } };
    mockedPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.logout({
      refreshToken: 'rt-456',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'rt-456',
    });
    expect(result.message).toBe('Logged out');
  });

  // ── getCurrentUser ─────────────────────────────────────

  it('getCurrentUser calls GET /auth/me', async () => {
    const mockResponse = {
      data: {
        email: 'test@example.com',
        role: 'PATIENT',
        provider: 'LOCAL',
        emailVerified: true,
        enabled: true,
      },
    };
    mockedGet.mockResolvedValueOnce(mockResponse);

    const result = await authService.getCurrentUser();

    expect(mockedGet).toHaveBeenCalledWith('/auth/me');
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('PATIENT');
  });
});
