import { Navigate, Outlet } from 'react-router-dom';

import { useOnboardingStatus } from '@/features/onboarding/hooks/useOnboardingStatus';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { OnboardingUnavailableState } from './OnboardingUnavailableState';

export const NutritionistOnboardingGuard = () => {
  const status = useOnboardingStatus();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'pending') {
    return <Navigate to="/onboarding/nutritionist" replace />;
  }

  if (status === 'unavailable') {
    return <OnboardingUnavailableState />;
  }

  return <Outlet />;
};
