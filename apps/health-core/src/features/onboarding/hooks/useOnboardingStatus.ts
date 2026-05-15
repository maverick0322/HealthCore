import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

export type OnboardingStatus = 'loading' | 'completed' | 'pending' | 'unavailable';

const resolveOnboardingStatus = async (role: 'PATIENT' | 'NUTRITIONIST'): Promise<OnboardingStatus> => {
  if (role === 'PATIENT') {
    const profile = await clinicalApi.getMyProfile();
    return profile.profileCompleted ? 'completed' : 'pending';
  }

  const profile = await clinicalApi.getMyNutritionistProfile();
  return profile.profileCompleted ? 'completed' : 'pending';
};

export const useOnboardingStatus = (): OnboardingStatus => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      setStatus('pending');
      return;
    }

    const role = user.role;
    if (role !== 'PATIENT' && role !== 'NUTRITIONIST') {
      setStatus('completed');
      return;
    }

    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        const resolvedStatus = await resolveOnboardingStatus(role);
        if (isMounted) {
          setStatus(resolvedStatus);
        }
      } catch (error) {
        const errStatus = (error as { response?: { status?: number } })?.response?.status;
        if (isMounted) {
          setStatus(errStatus === 404 || errStatus === 401 || errStatus === 403 ? 'pending' : 'unavailable');
        }
      }
    };

    void checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return status;
};
