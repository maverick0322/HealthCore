/**
 * Centralized environment configuration.
 *
 * During development the Vite proxy forwards `/api` requests to the
 * API gateway, so the base URL is just the path prefix.
 */

export const ENV = {
  /** Base URL for all API calls (relative — handled by Vite proxy in dev). */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',

  /**
   * Base URL of the identity service for OAuth2 redirects.
   * OAuth2 flows require a full-page redirect (not proxied XHR),
   * so this must be the actual backend origin.
   */
  IDENTITY_SERVICE_URL: import.meta.env.VITE_IDENTITY_SERVICE_URL || 'http://localhost:8082',
} as const;
