import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useAuthStore } from './useAuthStore';
import { authService } from '@/features/auth/services/authService';

vi.mock('@/features/auth/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

const authServiceMock = vi.mocked(authService);

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store between tests
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setTokens updates tokens and marks as authenticated', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      tokenType: 'Bearer',
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test-access');
    expect(state.refreshToken).toBe('test-refresh');
    expect(state.isAuthenticated).toBe(true);
  });

  it('clearSession resets all state', () => {
    // First set some state
    useAuthStore.getState().setTokens({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      tokenType: 'Bearer',
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    // Verify it was set
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Now clear
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('exposes login, register, logout, fetchCurrentUser functions', () => {
    const state = useAuthStore.getState();

    expect(typeof state.login).toBe('function');
    expect(typeof state.register).toBe('function');
    expect(typeof state.logout).toBe('function');
    expect(typeof state.fetchCurrentUser).toBe('function');
  });

  it('does not mark the session authenticated until the user profile is loaded', async () => {
    authServiceMock.login.mockResolvedValue({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      tokenType: 'Bearer',
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    let resolveCurrentUser!: () => void;
    authServiceMock.getCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveCurrentUser = () => resolve({
          email: 'patient@example.com',
          role: 'PATIENT',
          provider: 'LOCAL',
          emailVerified: true,
          enabled: true,
        });
      }),
    );

    const loginPromise = useAuthStore.getState().login({
      email: 'patient@example.com',
      password: 'secret',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('test-access');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    resolveCurrentUser();
    await loginPromise;

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('PATIENT');
  });

});
