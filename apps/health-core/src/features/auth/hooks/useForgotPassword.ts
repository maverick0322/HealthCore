import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { authService } from '@/features/auth/services/authService';

/**
 * Hook that requests a password reset email.
 * On success navigates to /verify-code with the email and flow state.
 */
export const useForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.requestPasswordReset({ email });
      navigate('/verify-code', {
        state: { email, flow: 'password-reset' },
        replace: true,
      });
    } catch (err: unknown) {
      console.error('[useForgotPassword] Request failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403) {
          setError(t('errorForbidden'));
        } else {
          setError(t('errorRequestFailed'));
        }
      } else {
        setError(t('errorUnexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleForgotPassword, isLoading, error };
};
