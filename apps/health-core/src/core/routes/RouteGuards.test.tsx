import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Route, Routes } from 'react-router-dom';

const mockAuthenticatedUser = {
  id: 'user-1',
  email: 'patient@example.com',
  role: 'PATIENT' as const,
  provider: 'LOCAL' as const,
  emailVerified: true,
  enabled: true,
};

// Helper to render a route guard with a dummy child route
const renderGuard = (
  Guard: typeof ProtectedRoute | typeof GuestRoute,
  path: string,
  initialEntries: string[],
) => {
  return render(
    <Routes>
      <Route element={<Guard />}>
        <Route path={path} element={<div data-testid="guarded-content">Protected</div>} />
      </Route>
      <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
    </Routes>,
    { initialEntries },
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('redirects to /login when not authenticated', () => {
    renderGuard(ProtectedRoute, '/dashboard', ['/dashboard']);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      accessToken: 'at-123',
      refreshToken: 'rt-456',
      isAuthenticated: true,
      user: mockAuthenticatedUser,
    });

    renderGuard(ProtectedRoute, '/dashboard', ['/dashboard']);
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });
});

