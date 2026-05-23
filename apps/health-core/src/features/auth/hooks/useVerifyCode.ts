import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { authService } from '@/features/auth/services/authService';
import { validateCode } from '../validators/authValidation';

interface VerifyCodeFieldErrors {
  code?: string;
}

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
  const [fieldErrors, setFieldErrors] = useState<VerifyCodeFieldErrors>({});

  const handleVerifyCode = async (
    email: string,
    code: string,
    flow: 'email-verification' | 'password-reset',
  ) => {
    setError(null);

    const codeError = validateCode(code);
    if (codeError) {
      setFieldErrors({ code: t(codeError) });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      if (flow === 'password-reset') {
        // Backend does not support pre-verifying password reset codes, so skip
        navigate('/reset-password', {
          state: { email, code },
          replace: true,
        });
        return;
      }

      await authService.verifyCode({ email, code });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      console.error('[useVerifyCode] Verification failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t('errorInvalidCode'));
        } else if (status === 410) {
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

  return { handleVerifyCode, isLoading, error, fieldErrors };
};
