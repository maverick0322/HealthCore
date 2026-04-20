import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { authService } from '@/features/auth/services/authService';

/**
 * Hook for email verification and password-reset code verification.
 * The `flow` determines what happens on success:
 *   - 'email-verification' → navigate to /login
 *   - 'password-reset'     → navigate to /reset-password with email + code
 */
export const useVerifyCode = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyCode = async (
    email: string,
    code: string,
    flow: 'email-verification' | 'password-reset',
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.verifyCode({ email, code });

      if (flow === 'email-verification') {
        navigate('/login', { replace: true });
      } else {
        navigate('/reset-password', {
          state: { email, code },
          replace: true,
        });
      }
    } catch (err: unknown) {
      console.error('[useVerifyCode] Verification failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t('errorInvalidCode'));
        } else if (status === 403) {
          setError(t('errorForbidden'));
        } else {
          setError(t('errorUnexpected'));
        }
      } else {
        setError(t('errorUnexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleVerifyCode, isLoading, error };
};
