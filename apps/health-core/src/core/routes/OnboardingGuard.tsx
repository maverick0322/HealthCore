import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useOnboardingStatus } from '@/features/onboarding/hooks/useOnboardingStatus';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { OnboardingUnavailableState } from './OnboardingUnavailableState';

const getDashboardPath = (role: string | undefined): string => {
  if (role === 'NUTRITIONIST') {
    return '/dashboard/nutritionist';
  }
  return '/dashboard/patient';
};

export const OnboardingGuard = () => {
  const status = useOnboardingStatus();
  const user = useAuthStore((state) => state.user);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'completed') {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  if (status === 'unavailable') {
    return <OnboardingUnavailableState />;
  }

  return <Outlet />;
};
