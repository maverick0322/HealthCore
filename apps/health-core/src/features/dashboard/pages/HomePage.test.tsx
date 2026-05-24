import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { HomePage } from './HomePage';

const setAuthenticatedUser = (role: 'PATIENT' | 'NUTRITIONIST') => {
  useAuthStore.setState({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    isAuthenticated: true,
    user: {
      email: 'user@example.com',
      role,
      provider: 'LOCAL',
      emailVerified: true,
      enabled: true,
    },
  });
};

describe('HomePage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('redirects patient users to the patient dashboard', () => {
    setAuthenticatedUser('PATIENT');

    render(
      <Routes>
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/dashboard/patient" element={<div>Patient dashboard</div>} />
      </Routes>,
      { initialEntries: ['/dashboard'] },
    );

    expect(screen.getByText('Patient dashboard')).toBeInTheDocument();
  });

  it('redirects nutritionist users to the nutritionist dashboard', () => {
    setAuthenticatedUser('NUTRITIONIST');

    render(
      <Routes>
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/dashboard/nutritionist" element={<div>Nutritionist dashboard</div>} />
      </Routes>,
      { initialEntries: ['/dashboard'] },
    );

    expect(screen.getByText('Nutritionist dashboard')).toBeInTheDocument();
  });
});
