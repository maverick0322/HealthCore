import axios from 'axios';

import { ENV } from '@/core/config/env';
import type { AuthTokensResponse } from '@/features/auth/types/auth.types';

/**
 * Shared Axios instance used by every service layer.
 *
 * - baseURL defaults to `/api/v1` (resolved by Vite proxy in dev).
 * - Interceptors are registered via `setupInterceptors()` in main.tsx
 *   to avoid circular-dependency issues (httpClient ↔ authStore).
 */
const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth callback contract (set by setupInterceptors) ────────
interface AuthCallbacks {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: AuthTokensResponse) => void;
  onSessionExpired: () => void;
}

let auth: AuthCallbacks | null = null;

// ── Flag to prevent multiple concurrent refresh attempts ─────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (token) {
      p.resolve(token);
    } else {
      p.reject(error);
    }
  });
  failedQueue = [];
};

/**
 * Call this once at app startup (in main.tsx) to wire the auth
 * store into the HTTP interceptors without creating a circular import.
 */
export const setupInterceptors = (callbacks: AuthCallbacks) => {
  auth = callbacks;

  // ── Request interceptor ──────────────────────────────────
  httpClient.interceptors.request.use((config) => {
    const token = auth?.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ── Response interceptor ─────────────────────────────────
  httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Only attempt refresh on 401 and not on the refresh endpoint itself
      if (
        error.response?.status !== 401 ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return httpClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = auth?.getRefreshToken();

        if (!refreshToken) {
          auth?.onSessionExpired();
          return Promise.reject(error);
        }

        // Call refresh endpoint directly to avoid interceptor loop
        const { data } = await axios.post(
          `${ENV.API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        auth?.onTokensRefreshed(data);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        auth?.onSessionExpired();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
};

export default httpClient;
