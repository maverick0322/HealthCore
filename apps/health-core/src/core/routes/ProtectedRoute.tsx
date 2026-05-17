import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
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
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [failedToFetchUser, setFailedToFetchUser] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user || isFetchingUser) {
      return;
    }

    setFailedToFetchUser(false);
    setIsFetchingUser(true);
    fetchCurrentUser()
      .then(() => {
        if (!useAuthStore.getState().user) {
          setFailedToFetchUser(true);
        }
      })
      .finally(() => setIsFetchingUser(false));
  }, [fetchCurrentUser, isAuthenticated, isFetchingUser, user]);

  if (!isAuthenticated || failedToFetchUser) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
