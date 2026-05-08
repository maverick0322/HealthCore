import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { UserRole } from '@/features/auth/types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Wrapper route that redirects unauthenticated users to /login.
 * If allowedRoles is provided, it verifies the user's role.
 * Renders child routes via <Outlet /> when authenticated and authorized
 */
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
