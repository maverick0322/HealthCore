import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useWeightHistoryModule from '@/features/patient/hooks/useWeightHistory';

import { WeightHistorySection } from './WeightHistorySection';

vi.mock('@/features/patient/hooks/useWeightHistory');

describe('WeightHistorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('renders period stats and history table', () => {
    render(<WeightHistorySection />);

    expect(screen.getByText('Current weight')).toBeInTheDocument();
    expect(screen.getByText('Weight history table')).toBeInTheDocument();
    expect(screen.getAllByText('78.1 kg').length).toBeGreaterThan(0);
  });

  it('changes the displayed aggregation when filters change', async () => {
    const user = userEvent.setup();
    render(<WeightHistorySection />);

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: 'Months' }));

    expect(screen.getAllByText('May 2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Apr 2026').length).toBeGreaterThan(0);
  });
});
