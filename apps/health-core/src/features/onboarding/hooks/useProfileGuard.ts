import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

export const useProfileGuard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        if (user?.role !== 'PATIENT') {
          setHasProfile(true);
          setIsLoading(false);
          return;
        }

        const profile = await clinicalApi.getMyProfile();
        if (profile?.profileCompleted) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
          navigate('/onboarding/patient', { replace: true });
        }
      } catch {
        setHasProfile(false);
        navigate('/onboarding/patient', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      void checkProfile();
    }
  }, [navigate, user]);

  return { isLoading, hasProfile };
};
