import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { authService } from '@/features/auth/services/authService';
import type {
  AuthTokensResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/types/auth.types';

// ── State shape ──────────────────────────────────────────────

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setTokens: (tokens: AuthTokensResponse) => void;
  clearSession: () => void;
}

// ── Store ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // ── Login ────────────────────────────────────────────
      login: async (data) => {
        set({ isLoading: true });
        try {
          const tokens = await authService.login(data);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
          });
          // Fetch user profile after login
          await get().fetchCurrentUser();
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Register ─────────────────────────────────────────
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          return response;
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Logout ───────────────────────────────────────────
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authService.logout({ refreshToken });
          }
        } catch (error) {
          // Ignore server-side logout errors (e.g. 401 already expired)
          console.warn('[useAuthStore] Backend logout failed or token already invalid', error);
        } finally {
          get().clearSession();
        }
      },

      // ── Fetch current user profile ───────────────────────
      fetchCurrentUser: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user });
        } catch {
          // If we can't fetch the user, the token is invalid
          get().clearSession();
        }
      },

      // ── Set tokens (used by HTTP interceptor on refresh) ─
      setTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      // ── Clear session (used on logout / refresh failure) ─
      clearSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'healthcore-auth',
      // Only persist tokens — user profile is re-fetched on app load
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
