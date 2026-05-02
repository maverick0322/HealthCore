import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { authService } from '@/features/auth/services/authService';

/**
 * Hook that confirms a password reset using the verification code.
 * Returns an `isSuccess` flag that the page can use to swap to a success view.
 */
export const useResetPassword = () => {
  const { t, i18n } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.confirmPasswordReset({ email, code, newPassword, locale: i18n.language });
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('[useResetPassword] Reset failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t('errorInvalidCode'));
        } else if (status === 403) {
          setError(t('errorForbidden'));
        } else {
          setError(t('errorResetFailed'));
        }
      } else {
        setError(t('errorUnexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleResetPassword, isLoading, error, isSuccess };
};
