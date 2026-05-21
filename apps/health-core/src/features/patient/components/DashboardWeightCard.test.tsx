import { render, screen } from '@/test/test-utils';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useRegisterWeightModule from '@/features/patient/hooks/useRegisterWeight';
import * as useWeightHistoryModule from '@/features/patient/hooks/useWeightHistory';

import { DashboardWeightCard } from './DashboardWeightCard';

vi.mock('@/features/patient/hooks/useWeightHistory');
vi.mock('@/features/patient/hooks/useRegisterWeight');
vi.mock('@/shared/components/ConfirmModal', () => ({
  ConfirmModal: ({
    isOpen,
    title,
    confirmText,
    cancelText,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <p>{title}</p>
        <button type="button" data-testid="confirm-submit" onClick={onConfirm}>{confirmText}</button>
        <button type="button" data-testid="confirm-back" onClick={onClose}>{cancelText}</button>
      </div>
    ) : null,
}));

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
    expect(screen.getByText('78.1 kg')).toBeInTheDocument();
    expect(screen.getByText('Change vs previous')).toBeInTheDocument();
    expect(screen.getByText('-0.4 kg')).toBeInTheDocument();
  });

  it('validates and submits a new weight entry through confirmation', async () => {
    const user = userEvent.setup();
    render(<DashboardWeightCard />);

    await user.click(screen.getByRole('button', { name: 'Record weight' }));
    await user.type(screen.getByLabelText('Weight (kg)'), '77.9');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-20' } });

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Do you want to save this weight entry?')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-submit'));

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

    fireEvent.click(screen.getByTestId('confirm-back'));

    expect(screen.queryByText('Do you want to save this weight entry?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Weight (kg)')).toHaveValue('77.9');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-20');
  });

  it('shows validation messages before opening confirmation', async () => {
    const user = userEvent.setup();
    render(<DashboardWeightCard />);

    await user.click(screen.getByRole('button', { name: 'Record weight' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter a weight value.')).toBeInTheDocument();
    expect(screen.queryByText('Do you want to save this weight entry?')).not.toBeInTheDocument();
  });
});
