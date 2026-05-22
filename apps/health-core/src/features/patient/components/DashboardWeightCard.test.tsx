import { render, screen } from '@/test/test-utils';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useRegisterWeightModule from '@/features/patient/hooks/useRegisterWeight';
import * as useWeightHistoryModule from '@/features/patient/hooks/useWeightHistory';

import { DashboardWeightCard } from './DashboardWeightCard';

vi.mock('@/features/patient/hooks/useWeightHistory');
vi.mock('@/features/patient/hooks/useRegisterWeight');

describe('DashboardWeightCard', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 60,
      targetWaterGlasses: 10,
    });

    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      data: [
        { weightKg: 78.5, date: '2026-05-12' },
        { weightKg: 78.1, date: '2026-05-18' },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useRegisterWeightModule.useRegisterWeight).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);
  });

  it('renders latest weight stats', () => {
    render(<DashboardWeightCard />);

    expect(screen.getByText('Latest weight')).toBeInTheDocument();
    expect(screen.getByText('Latest weight record date')).toBeInTheDocument();
    expect(screen.getByText('Change compared with previous')).toBeInTheDocument();
    expect(screen.getAllByText('78.1 kg').length).toBeGreaterThan(0);
    expect(screen.getByText('-0.4 kg')).toBeInTheDocument();
    expect(screen.getAllByText('78.5 kg').length).toBeGreaterThan(0);
  });

  it('validates and submits a new weight entry through confirmation', async () => {
    const user = userEvent.setup();
    render(<DashboardWeightCard />);

    await user.click(screen.getByRole('button', { name: 'Record weight' }));
    await user.type(screen.getByLabelText('Weight (kg)'), '77.9');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-20' } });

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Do you want to save this weight entry?')).toBeInTheDocument();
    expect(screen.queryByLabelText('Weight (kg)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes, save' }));

    expect(mutateAsync).toHaveBeenCalledWith({ weightKg: 77.9, date: '2026-05-20' });
  });

  it('returns to the form when the user cancels the confirmation step', async () => {
    const user = userEvent.setup();
    render(<DashboardWeightCard />);

    await user.click(screen.getByRole('button', { name: 'Record weight' }));
    await user.type(screen.getByLabelText('Weight (kg)'), '77.9');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-20' } });

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Do you want to save this weight entry?')).toBeInTheDocument();
    expect(screen.queryByLabelText('Weight (kg)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.queryByText('Do you want to save this weight entry?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Weight (kg)')).toHaveValue('77.9');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-20');
  });

  it('shows validation messages before opening confirmation', async () => {
    const user = userEvent.setup();
    render(<DashboardWeightCard />);

    await user.click(screen.getByRole('button', { name: 'Record weight' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter a weight to continue.')).toBeInTheDocument();
    expect(screen.queryByText('Do you want to save this weight entry?')).not.toBeInTheDocument();
  });
});
