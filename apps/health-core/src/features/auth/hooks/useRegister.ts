import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { RegisterRequest } from '@/features/auth/types/auth.types';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../validators/authValidation';

interface RegisterFieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

/**
 * Hook that wraps the auth store's register action.
 * On success navigates to /verify-code passing the email via router state.
 * Validates fields before calling the service; password mismatch is
 * detected here so the page stays thin.
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('auth');
  const register = useAuthStore((s) => s.register);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const handleRegister = async (
    data: RegisterRequest & { confirmPassword?: string; acceptTerms?: boolean },
  ) => {
    setError(null);

    const emailError = validateEmail(data.email);
    const passwordError = validatePassword(data.password, 'register');
    const confirmError = data.confirmPassword !== undefined
      ? validatePasswordMatch(data.password, data.confirmPassword)
      : null;

    const errors: RegisterFieldErrors = {};
    if (emailError) errors.email = t(emailError);
    if (passwordError) errors.password = t(passwordError);
    if (confirmError) errors.confirmPassword = t(confirmError);
    if (!data.acceptTerms) errors.acceptTerms = t('validation.termsRequired');

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await register({ email: data.email, password: data.password, role: data.role, locale: i18n.language });
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

  return { handleRegister, isLoading, error, fieldErrors };
};
