import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/useAuthStore';

/**
 * Wrapper route that redirects unauthenticated users to /login.
 * Renders child routes via <Outlet /> when authenticated.
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
