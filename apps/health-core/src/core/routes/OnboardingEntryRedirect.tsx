import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const OnboardingEntryRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'NUTRITIONIST') {
    return <Navigate to="/onboarding/nutritionist" replace />;
  }

  return <Navigate to="/onboarding/patient" replace />;
};
