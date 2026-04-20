import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Route, Routes } from 'react-router-dom';

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
      <Route path="/" element={<div data-testid="home-page">Home</div>} />
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
    useAuthStore.getState().setTokens({
      accessToken: 'at-123',
      refreshToken: 'rt-456',
      tokenType: 'Bearer',
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    renderGuard(ProtectedRoute, '/dashboard', ['/dashboard']);
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('renders children when not authenticated', () => {
    renderGuard(GuestRoute, '/signup', ['/signup']);
    expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
  });

  it('redirects to / when authenticated', () => {
    useAuthStore.getState().setTokens({
      accessToken: 'at-123',
      refreshToken: 'rt-456',
      tokenType: 'Bearer',
      accessTokenExpiresInMs: 300000,
      refreshTokenExpiresInMs: 86400000,
    });

    renderGuard(GuestRoute, '/signup', ['/signup']);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
