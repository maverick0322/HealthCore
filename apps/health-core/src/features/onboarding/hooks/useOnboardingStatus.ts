import { useEffect, useState } from 'react';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

export type OnboardingStatus = 'loading' | 'completed' | 'pending';

/**
 * Hook that checks if the user has already completed onboarding
 * by attempting to fetch their clinical profile.
 *
 * @returns {OnboardingStatus} The current onboarding status:
 *   - 'loading': Still checking the backend
 *   - 'completed': User has a clinical profile (onboarding done)
 *   - 'pending': User doesn't have a clinical profile yet
 */
export const useOnboardingStatus = (): OnboardingStatus => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Attempt to fetch user's goals (only available after onboarding)
        await clinicalApi.getMyGoals();
        // If successful, user has completed onboarding
        setStatus('completed');
      } catch (error: any) {
        // If 404 or any error, user hasn't completed onboarding
        // We treat any error as "not onboarded" for safety
        setStatus('pending');
      }
    };

    checkOnboardingStatus();
  }, []);

  return status;
};
