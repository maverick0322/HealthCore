import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

/**
 * Home Dashboard — shown after login.
 * Automatically redirects users to role-specific dashboards:
 * - PATIENT → /dashboard/patient
 * - NUTRITIONIST → /dashboard/nutritionist
 * - ADMIN → /dashboard/admin (placeholder)
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role;

  useEffect(() => {
    console.info('[HomePage] Render', { role });
  }, [role]);

  // Wait for role before redirecting to avoid blank renders
  if (!role) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (role === 'PATIENT') {
    return <Navigate to="/dashboard/patient" replace />;
  }
  if (role === 'NUTRITIONIST') {
    return <Navigate to="/dashboard/nutritionist" replace />;
  }
  if (role === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role === 'NUTRITIONIST'
    ? t('nutritionist')
    : user?.role === 'ADMIN'
      ? 'Admin'
      : t('patient');

  const roleColor = user?.role === 'NUTRITIONIST'
    ? 'text-blue-400'
    : user?.role === 'ADMIN'
      ? 'text-amber-400'
      : 'text-primary';

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">

      <SettingsBar />

      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
            <svg
              className="w-9 h-9 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HealthCore</h1>
        </div>

        {/* Dashboard Card */}
        <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border shadow-md space-y-6 transition-colors duration-500">

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium truncate ml-4">
                {user?.email ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className={`text-sm font-semibold ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <span className="text-sm font-medium">
                {user?.provider ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email Verified</span>
              <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-500' : 'text-destructive'}`}>
                {user?.emailVerified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Placeholder message */}
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dashboard content for <span className={`font-semibold ${roleColor}`}>{roleLabel}</span> coming soon.
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-11 font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Logout
          </Button>
        </div>

        <footer className="text-center pt-4 pb-4">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {t('footer')}
          </p>
        </footer>
      </div>
    </div>
  );
};
