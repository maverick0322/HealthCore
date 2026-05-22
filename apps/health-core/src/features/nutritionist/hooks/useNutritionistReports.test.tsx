import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetNutritionistWeightProgressReport,
  mockGetMyAppointments,
} = vi.hoisted(() => ({
  mockGetNutritionistWeightProgressReport: vi.fn(),
  mockGetMyAppointments: vi.fn(),
}));

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: { email: string } }) => unknown) =>
    selector({ user: { email: 'nutri@example.com' } }),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistWeightProgressReport: mockGetNutritionistWeightProgressReport,
  },
}));

vi.mock('@/features/nutritionist/services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    getMyAppointments: mockGetMyAppointments,
  },
}));

import { useNutritionistReports } from './useNutritionistReports';

describe('useNutritionistReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads weight report and appointments in parallel', async () => {
    mockGetNutritionistWeightProgressReport.mockResolvedValue({
      activePatients: 2,
      patientsWithoutWeightInRange: 1,
      rows: [],
    });
    mockGetMyAppointments.mockResolvedValue([
      {
        id: 'appointment-1',
        slotId: 'slot-1',
        nutritionistId: 'nutri-1',
        patientId: 'patient-1',
        startTime: '2026-05-10T15:00:00.000Z',
        endTime: '2026-05-10T15:30:00.000Z',
        status: 'ATTENDED',
        version: 1,
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useNutritionistReports('1m'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetNutritionistWeightProgressReport).toHaveBeenCalledTimes(1);
    expect(mockGetMyAppointments).toHaveBeenCalledTimes(1);
    expect(result.current.data?.appointmentSummary.attendedCount).toBe(1);
    expect(result.current.data?.weightReport.activePatients).toBe(2);
  });
});
