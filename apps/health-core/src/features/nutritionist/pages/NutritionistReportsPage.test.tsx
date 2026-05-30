import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';

const mockUseNutritionistReports = vi.fn();
const mockExportNutritionistReportPdf = vi.fn();

vi.mock('@/features/nutritionist/hooks/useNutritionistReports', () => ({
  useNutritionistReports: (rangeKey: string) => mockUseNutritionistReports(rangeKey),
}));

vi.mock('@/features/nutritionist/services/reportPdfService', () => ({
  exportNutritionistReportPdf: (...args: unknown[]) => mockExportNutritionistReportPdf(...args),
}));

vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

import { NutritionistReportsPage } from './NutritionistReportsPage';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('NutritionistReportsPage', () => {
  it('renders the report overview and exports the pdf with current data', async () => {
    const user = userEvent.setup();
    mockUseNutritionistReports.mockReturnValue({
      data: {
        period: {
          key: '1m',
          fromDateKey: '2026-05-01',
          toDateKey: '2026-05-30',
          fromIso: '2026-05-01T00:00:00.000Z',
          toIso: '2026-05-30T23:59:59.999Z',
        },
        appointments: [],
        appointmentSummary: {
          attendedCount: 4,
          cancelledCount: 1,
          relevantCount: 5,
          attendedPercent: 80,
          cancelledPercent: 20,
        },
        weightReport: {
          activePatients: 7,
          rows: [
            {
              patientId: 'patient-1',
              fullName: 'Ana Lopez Ruiz',
              latestRecordDateInRange: '2026-05-28',
              startWeightKg: 70,
              currentWeightKg: 67.5,
              netChangeKg: -2.5,
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <NutritionistReportsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Reports and Operational Management')).toBeInTheDocument();
    expect(screen.getByText('Ana Lopez Ruiz')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export report PDF' }));

    await waitFor(() => {
      expect(mockExportNutritionistReportPdf).toHaveBeenCalledTimes(1);
    });
  });
});
