import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetNutritionistWeightProgressReport,
  mockGetAppointmentReport,
  mockGetSlotReport,
} = vi.hoisted(() => ({
  mockGetNutritionistWeightProgressReport: vi.fn(),
  mockGetAppointmentReport: vi.fn(),
  mockGetSlotReport: vi.fn(),
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
    getAppointmentReport: mockGetAppointmentReport,
    getSlotReport: mockGetSlotReport,
  },
}));

import { useNutritionistReports } from './useNutritionistReports';

describe('useNutritionistReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads weight report, appointment report, and inactive slots in parallel', async () => {
    mockGetNutritionistWeightProgressReport.mockResolvedValue({
      activePatients: 2,
      patientsWithoutWeightInRange: 1,
      rows: [],
    });
    mockGetAppointmentReport.mockResolvedValue([
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
    mockGetSlotReport.mockResolvedValue([{ id: 'slot-1', active: false }]);

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
    expect(mockGetAppointmentReport).toHaveBeenCalledTimes(1);
    expect(mockGetSlotReport).toHaveBeenCalledTimes(1);
    expect(result.current.data?.appointmentSummary.attendedCount).toBe(1);
    expect(result.current.data?.deactivatedSlots).toHaveLength(1);
    expect(result.current.data?.weightReport.activePatients).toBe(2);
  });
});
