import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';
import { getCalendarMonthRange } from '@/features/nutritionist/utils/reporting';

const {
  mockGetNutritionistWeightProgressReport,
  mockGetAppointmentReport,
  mockExportNutritionistReportPdf,
} = vi.hoisted(() => ({
  mockGetNutritionistWeightProgressReport: vi.fn(),
  mockGetAppointmentReport: vi.fn(),
  mockExportNutritionistReportPdf: vi.fn(),
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
  },
}));

vi.mock('@/features/nutritionist/services/reportPdfService', () => ({
  exportNutritionistReportPdf: mockExportNutritionistReportPdf,
}));

vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

import { NutritionistReportsPage } from './NutritionistReportsPage';

const buildQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderPage = () => {
  const queryClient = buildQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <NutritionistReportsPage />
    </QueryClientProvider>
  );
};

describe('NutritionistReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const threeMonthRange = getCalendarMonthRange('3m');

    mockGetNutritionistWeightProgressReport.mockImplementation(async (from: string) => {
      if (from === threeMonthRange.fromDateKey) {
        return {
          activePatients: 2,
          patientsWithoutWeightInRange: 0,
          rows: [
            {
              patientId: 'patient-1',
              fullName: 'Ana Lopez',
              latestRecordDateInRange: '2026-05-21',
              startWeightKg: 74,
              currentWeightKg: 70.5,
              netChangeKg: -3.5,
              hasRecordsInRange: true,
            },
          ],
        };
      }

      return {
        activePatients: 2,
        patientsWithoutWeightInRange: 1,
        rows: [
          {
            patientId: 'patient-1',
            fullName: 'Ana Lopez',
            latestRecordDateInRange: '2026-05-21',
            startWeightKg: 72,
            currentWeightKg: 70.5,
            netChangeKg: -1.5,
            hasRecordsInRange: true,
          },
          {
            patientId: 'patient-2',
            fullName: 'Luis Herrera',
            latestRecordDateInRange: null,
            startWeightKg: null,
            currentWeightKg: null,
            netChangeKg: null,
            hasRecordsInRange: false,
          },
        ],
      };
    });

    mockGetAppointmentReport.mockImplementation(async (from: string) => {
      if (from === threeMonthRange.fromIso) {
        return [
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
          {
            id: 'appointment-2',
            slotId: 'slot-2',
            nutritionistId: 'nutri-1',
            patientId: 'patient-2',
            startTime: '2026-05-12T16:00:00.000Z',
            endTime: '2026-05-12T16:30:00.000Z',
            status: 'ATTENDED',
            version: 1,
          },
        ];
      }

      return [
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
        {
          id: 'appointment-2',
          slotId: 'slot-2',
          nutritionistId: 'nutri-1',
          patientId: 'patient-2',
          startTime: '2026-05-12T16:00:00.000Z',
          endTime: '2026-05-12T16:30:00.000Z',
          status: 'CANCELLED',
          version: 1,
        },
      ];
    });
  });

  it('renders the live report, changes filters and exports the current view', async () => {
    const user = userEvent.setup();
    const threeMonthRange = getCalendarMonthRange('3m');
    renderPage();

    expect(await screen.findByText('Reports and Operational Management')).toBeInTheDocument();
    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument();
    expect(screen.getByText('Luis Herrera')).toBeInTheDocument();
    expect(screen.getByText('No records in this period')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '3 months' }));

    await waitFor(() => {
      expect(mockGetNutritionistWeightProgressReport).toHaveBeenCalledWith(
        threeMonthRange.fromDateKey,
        threeMonthRange.toDateKey
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export report PDF' }));

    await waitFor(() => {
      expect(mockExportNutritionistReportPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: `nutritionist-report-${threeMonthRange.fromDateKey}-to-${threeMonthRange.toDateKey}.pdf`,
        })
      );
    });
  });

  it('shows the empty appointment state when there are no relevant appointments', async () => {
    mockGetAppointmentReport.mockResolvedValueOnce([
      {
        id: 'appointment-1',
        slotId: 'slot-1',
        nutritionistId: 'nutri-1',
        patientId: 'patient-1',
        startTime: '2026-05-10T15:00:00.000Z',
        endTime: '2026-05-10T15:30:00.000Z',
        status: 'CONFIRMED',
        version: 1,
      },
    ]);

    renderPage();

    expect(
      await screen.findByText('There were no attended or cancelled appointments in this period')
    ).toBeInTheDocument();
  });
});
