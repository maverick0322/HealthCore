import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { RegisterRequest } from '@/features/auth/types/auth.types';

/**
 * Hook that wraps the auth store's register action.
 * On success navigates to /verify-code passing the email via router state.
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('auth');
  const register = useAuthStore((s) => s.register);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (data: RegisterRequest) => {
    setError(null);
    setIsLoading(true);
    try {
      await register({ ...data, locale: i18n.language });
      navigate('/verify-code', {
        state: { email: data.email, flow: 'email-verification' },
        replace: true,
      });
    } catch (err: unknown) {
      console.error('[useRegister] Registration failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setError(t('errorEmailExists'));
        } else if (status === 400) {
          setError(t('errorValidation'));
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

  return { handleRegister, isLoading, error };
};
