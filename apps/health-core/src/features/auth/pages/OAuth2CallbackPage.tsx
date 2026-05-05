import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { AuthTokensResponse } from '@/features/auth/types/auth.types';

/**
 * OAuth2 callback page.
 *
 * After the Spring backend completes the OAuth2 Authorization Code flow
 * with Auth0, the OAuth2LoginSuccessHandler returns a JSON response
 * containing the JWT tokens. Since this is a full-page redirect flow,
 * the browser ends up on the backend's response page.
 *
 * This page handles the alternative redirect approach where the backend
 * redirects to the frontend with tokens as query parameters:
 *   /oauth2/callback?accessToken=...&refreshToken=...
 *
 * If your backend is configured to redirect here, it will parse the
 * tokens from the URL and store them.
 */
export const OAuth2CallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('auth');
  const setTokens = useAuthStore((s) => s.setTokens);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  const [asyncError, setAsyncError] = useState<string | null>(null);

  let error = asyncError;
  if (urlError) {
    error = t('oauth2CallbackError');
  } else if (!accessToken || !refreshToken) {
    error = t('oauth2NoTokens');
  }

  useEffect(() => {
    if (urlError) {
      console.error(`OAuth2 login error: ${urlError} - ${urlMessage}`);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      const tokens: AuthTokensResponse = {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        accessTokenExpiresInMs: 300000,
        refreshTokenExpiresInMs: 86400000,
      };

      setTokens(tokens);
      fetchCurrentUser().then(() => {
        const currentUser = useAuthStore.getState().user;
        const expectedRole = sessionStorage.getItem("expectedRole");
        if (expectedRole && currentUser && currentUser.role !== expectedRole) {
          useAuthStore.getState().logout();
          setAsyncError(t('oauth2RoleMismatch'));
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }
        sessionStorage.removeItem("expectedRole");
        navigate('/', { replace: true });
      });
    } else {
      // Redirect to login after a brief delay
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }, [searchParams, setTokens, fetchCurrentUser, navigate, t, urlError, urlMessage, accessToken, refreshToken]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background text-foreground">
      {error ? (
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">{t('oauth2Redirecting')}</p>
        </div>
      ) : (
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('oauth2CallbackTitle')}</p>
        </div>
      )}
    </div>
  );
};

