import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useDeleteWeightRecordModule from '@/features/patient/hooks/useDeleteWeightRecord';
import * as useEditWeightRecordModule from '@/features/patient/hooks/useEditWeightRecord';
import * as useWeightHistoryModule from '@/features/patient/hooks/useWeightHistory';
import { todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import { getWeightRangeWindow } from '@/features/patient/utils/weightHistory';

import { WeightHistorySection } from './WeightHistorySection';

vi.mock('@/features/patient/hooks/useWeightHistory');
vi.mock('@/features/patient/hooks/useEditWeightRecord');
vi.mock('@/features/patient/hooks/useDeleteWeightRecord');

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const formatLongDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

describe('WeightHistorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      data: [
        { weightKg: 82.0, date: '2026-01-03' },
        { weightKg: 81.5, date: '2026-02-10' },
        { weightKg: 80.2, date: '2026-03-29' },
        { weightKg: 79.3, date: '2026-04-27' },
        { weightKg: 78.1, date: '2026-05-18' },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useEditWeightRecordModule.useEditWeightRecord).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteWeightRecordModule.useDeleteWeightRecord).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it('renders the analysis view with adaptive filters and history table', async () => {
    const records = [
      { weightKg: 82.0, date: '2026-01-03' },
      { weightKg: 81.5, date: '2026-02-10' },
      { weightKg: 80.2, date: '2026-03-29' },
      { weightKg: 79.3, date: '2026-04-27' },
      { weightKg: 78.1, date: '2026-05-18' },
    ];
    const rangeWindow = getWeightRangeWindow('30d', records, todayDateKey());

    render(<WeightHistorySection />);

    expect(screen.getByText('My weight progress')).toBeInTheDocument();
    expect(screen.getByText('Previous records')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Showing records from ${formatLongDate(rangeWindow.fromDate)} to ${formatLongDate(rangeWindow.toDate)}`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 months' })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('button', { name: '1 year' })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getAllByText('78.1 kg').length).toBeGreaterThan(0);
  });

  it('updates the filtered table when the range changes', async () => {
    const user = userEvent.setup();
    const records = [
      { weightKg: 82.0, date: '2026-01-03' },
      { weightKg: 81.5, date: '2026-02-10' },
      { weightKg: 80.2, date: '2026-03-29' },
      { weightKg: 79.3, date: '2026-04-27' },
      { weightKg: 78.1, date: '2026-05-18' },
    ];
    const rangeWindow = getWeightRangeWindow('all', records, todayDateKey());
    render(<WeightHistorySection />);

    expect(screen.queryByText('January 3, 2026')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'From the start' }));

    expect(screen.getByText('January 3, 2026')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Showing records from ${formatLongDate(rangeWindow.fromDate)} to ${formatLongDate(rangeWindow.toDate)}`
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText('May 18, 2026').length).toBeGreaterThan(0);
  });

  it('shows the educational empty state when only one record is available in the selected view', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      data: [{ weightKg: 80.0, date: '2026-05-18' }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<WeightHistorySection />);

    expect(screen.getByText('Your starting point is 80.0 kg.')).toBeInTheDocument();
    expect(screen.getByText('Log your next weight to start seeing your progress here.')).toBeInTheDocument();
    expect(screen.getAllByText('May 18, 2026').length).toBeGreaterThan(0);
  });
});
