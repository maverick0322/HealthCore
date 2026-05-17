import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PatientOnboardingGuard } from './PatientOnboardingGuard';
import * as useOnboardingStatusModule from '@/features/onboarding/hooks/useOnboardingStatus';

vi.mock('@/features/onboarding/hooks/useOnboardingStatus');
vi.mock('@/shared/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock router components
const MockPatientDashboard = () => <div data-testid="patient-dashboard">Patient Dashboard</div>;
const MockOnboarding = () => <div data-testid="onboarding-page">Onboarding Page</div>;

describe('PatientOnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while checking onboarding status', () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('loading');

    render(
      <MemoryRouter initialEntries={["/dashboard/patient"]}>
        <Routes>
          <Route path="/dashboard/patient" element={<PatientOnboardingGuard />}>
            <Route index element={<MockPatientDashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should redirect to /onboarding/patient when onboarding is pending', async () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('pending');

    render(
      <MemoryRouter initialEntries={["/dashboard/patient"]}>
        <Routes>
          <Route path="/dashboard/patient" element={<PatientOnboardingGuard />}>
            <Route index element={<MockPatientDashboard />} />
          </Route>
          <Route path="/onboarding/patient" element={<MockOnboarding />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('patient-dashboard')).not.toBeInTheDocument();
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    });
  });

  it('should allow access to patient routes when onboarding is completed', async () => {
    vi.spyOn(useOnboardingStatusModule, 'useOnboardingStatus').mockReturnValue('completed');

    render(
      <MemoryRouter initialEntries={["/dashboard/patient"]}>
        <Routes>
          <Route path="/dashboard/patient" element={<PatientOnboardingGuard />}>
            <Route index element={<MockPatientDashboard />} />
          </Route>
          <Route path="/onboarding/patient" element={<MockOnboarding />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('patient-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('onboarding-page')).not.toBeInTheDocument();
    });
  });
});
