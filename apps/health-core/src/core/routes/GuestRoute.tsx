import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/useAuthStore';

/**
 * Wrapper route that redirects already-authenticated users away from
 * guest-only pages (login, signup, etc.) back to the home dashboard.
 */
export const GuestRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
