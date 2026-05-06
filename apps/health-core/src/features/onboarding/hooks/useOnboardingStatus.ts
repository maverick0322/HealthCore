import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

export type OnboardingStatus = 'loading' | 'completed' | 'pending';

/**
 * Hook that checks if the user has already completed onboarding
 * by attempting to fetch their clinical profile.
 *
 * Only attempts to check if the user has a valid access token.
 * If authentication is not available, defaults to 'pending'.
 *
 * @returns {OnboardingStatus} The current onboarding status:
 * - 'loading': Still checking the backend or waiting for auth
 * - 'completed': User has a clinical profile (onboarding done)
 * - 'pending': User doesn't have a clinical profile yet
 */
export const useOnboardingStatus = (): OnboardingStatus => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      setStatus('pending');
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        await clinicalApi.getMyGoals(user.email);
        setStatus('completed');
      } catch (error: any) {
        const errStatus = error.response?.status;
        
        if (errStatus === 404) {
          setStatus('pending');
        } else if (errStatus === 401 || errStatus === 403) {
          setStatus('loading');
        } else {
          console.warn('[useOnboardingStatus] Unexpected error checking onboarding status:', error.message);
          setStatus('completed');
        }
      }
    };

    checkOnboardingStatus();
  }, [user]);

  return status;
};