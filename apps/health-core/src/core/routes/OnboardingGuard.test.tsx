import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OnboardingGuard } from './OnboardingGuard';
import * as useOnboardingStatusModule from '@/features/onboarding/hooks/useOnboardingStatus';

vi.mock('@/features/onboarding/hooks/useOnboardingStatus');
vi.mock('@/shared/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock router components
const MockPatientOnboarding = () => <div data-testid="onboarding-page">Onboarding Page</div>;
const MockDashboard = () => <div data-testid="dashboard-page">Dashboard Page</div>;

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while checking onboarding status', () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('loading');

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingGuard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should allow access to onboarding routes when status is pending', async () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('pending');

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingGuard />}>
            <Route index element={<MockPatientOnboarding />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    });
  });

  it('should redirect to /dashboard/patient when status is completed', async () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('completed');

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingGuard />}>
            <Route index element={<MockPatientOnboarding />} />
          </Route>
          <Route path="/dashboard/patient" element={<MockDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });
});
