import { Navigate, Outlet } from 'react-router-dom';
import { useOnboardingStatus } from '@/features/onboarding/hooks/useOnboardingStatus';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

/**
 * Route guard that protects the onboarding routes.
 *
 * - If user is loading: Show spinner
 * - If user has completed onboarding: Redirect to /dashboard/patient
 * - If user hasn't completed onboarding: Allow access to /onboarding/patient
 *
 * Usage in router:
 *   {
 *     path: "/onboarding",
 *     element: <OnboardingGuard />,
 *     children: [
 *       {
 *         path: "/onboarding/patient",
 *         element: <PatientOnboardingPage />
 *       }
 *     ]
 *   }
 */
export const OnboardingGuard = () => {
  const status = useOnboardingStatus();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If user already completed onboarding, redirect to patient dashboard
  if (status === 'completed') {
    return <Navigate to="/dashboard/patient" replace />;
  }

  // Otherwise, allow access to onboarding routes
  return <Outlet />;
};
