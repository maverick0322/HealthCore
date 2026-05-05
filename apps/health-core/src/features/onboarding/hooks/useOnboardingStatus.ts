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
 *   - 'loading': Still checking the backend or waiting for auth
 *   - 'completed': User has a clinical profile (onboarding done)
 *   - 'pending': User doesn't have a clinical profile yet
 */
export const useOnboardingStatus = (): OnboardingStatus => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    // If no access token, user is not authenticated
    // Default to pending to allow onboarding flow
    if (!accessToken) {
      setStatus('pending');
      return;
    }

    // Prefer the user object from the auth store instead of extracting from token
    const user = useAuthStore.getState().user;
    if (!user) {
      setStatus('pending');
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        // Attempt to fetch user's goals (only available after onboarding)
        await clinicalApi.getMyGoals();
        // If successful, user has completed onboarding
        setStatus('completed');
      } catch (error: any) {
        // 404 means user hasn't completed onboarding yet — this is expected
        // Any other error also defaults to "pending" for safety
        const status = error.response?.status;
        
        if (status === 404) {
          // Expected: user is new and hasn't created a clinical profile
          setStatus('pending');
        } else {
          // Unexpected error: still treat as pending to let user proceed to onboarding
          console.warn('[useOnboardingStatus] Unexpected error checking onboarding status:', {
            status,
            message: error.message,
          });
          setStatus('pending');
        }
      }
    };

    checkOnboardingStatus();
  }, [accessToken]);

  return status;
};
