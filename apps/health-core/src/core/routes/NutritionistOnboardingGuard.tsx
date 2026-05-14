import { Navigate, Outlet } from 'react-router-dom';

import { useOnboardingStatus } from '@/features/onboarding/hooks/useOnboardingStatus';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

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

  return <Outlet />;
};
