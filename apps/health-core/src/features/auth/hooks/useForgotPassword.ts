import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { authService } from '@/features/auth/services/authService';
import { validateEmail } from '../validators/authValidation';

interface ForgotPasswordFieldErrors {
  email?: string;
}

/**
 * Hook that requests a password reset email.
 * On success navigates to /verify-code with the email and flow state.
 */
export const useForgotPassword = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFieldErrors>({});

  const handleForgotPassword = async (email: string) => {
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: t(emailError) });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await authService.requestPasswordReset({ email, locale: i18n.language });
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
        } else if (status === 404) {
          // Intentionally generic — avoid revealing whether an account exists
          setError(t('errorRequestFailed'));
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

  return { handleForgotPassword, isLoading, error, fieldErrors };
};
