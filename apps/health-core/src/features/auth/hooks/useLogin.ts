import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { type LoginRequest } from '../types/auth.types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { validateEmail, validatePassword } from '../validators/authValidation';

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const handleLogin = async (data: LoginRequest) => {
    setError(null);

    const emailError = validateEmail(data.email);
    const passwordError = validatePassword(data.password, 'login');

    const errors: LoginFieldErrors = {};
    if (emailError) errors.email = t(emailError);
    if (passwordError) errors.password = t(passwordError);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(data);
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      console.error('[useLogin] Login failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t('errorInvalidCredentials'));
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

  return { handleLogin, isLoading, error, fieldErrors };
};
