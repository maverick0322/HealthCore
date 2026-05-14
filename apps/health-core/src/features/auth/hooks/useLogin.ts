import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { LoginRequest } from '@/features/auth/types/auth.types';

/**
 * Hook that wraps the auth store's login action with
 * local form state, loading flag, and error handling.
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useAuthStore((s) => s.logout);

  const handleLogin = async (data: LoginRequest, expectedRole?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data);
              
      const currentUser = useAuthStore.getState().user;
      
      if (expectedRole) {
        if (currentUser && currentUser.role !== expectedRole) {
          await logout();
          setError(t('errorInvalidCredentials')); // Or a specific role mismatch error
          return;
        }
      }

      // Redirect to role dashboard. PatientOnboardingGuard will enforce onboarding.
      if (currentUser?.role === 'PATIENT') {
        navigate('/dashboard/patient', { replace: true });
      } else if (currentUser?.role === 'NUTRITIONIST') {
        navigate('/dashboard/nutritionist', { replace: true });
      } else if (currentUser?.role === 'ADMIN') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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

  return { handleLogin, isLoading, error };
};
