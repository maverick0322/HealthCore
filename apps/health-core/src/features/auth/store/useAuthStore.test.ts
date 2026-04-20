import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store between tests
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
});
