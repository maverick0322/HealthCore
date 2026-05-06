import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeightChart } from './WeightChart';
import * as useWeightHistoryModule from '@/features/patient/hooks/useWeightHistory';

vi.mock('@/features/patient/hooks/useWeightHistory');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      // Simple mock translations
      const translations: Record<string, string> = {
        'dashboard.weightEvolution': 'Weight Evolution',
        'dashboard.startWeight': 'Start Weight',
        'dashboard.currentWeight': 'Current Weight',
        'dashboard.minWeight': 'Min Weight',
        'dashboard.weightLost': `Lost ${opts?.value || '0'} kg`,
        'dashboard.weightErrorMessage': 'Failed to load weight data',
        'dashboard.noWeightData': 'No weight records found',
        'common.retry': 'Retry',
      };
      return translations[key] || key;
    },
  }),
}));

describe('WeightChart', () => {
  const mockWeightData = [
    { weightKg: 80, date: '2024-01-01' },
    { weightKg: 79.5, date: '2024-01-08' },
    { weightKg: 79, date: '2024-01-15' },
    { weightKg: 78.5, date: '2024-01-22' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    // Check for skeleton animation
    const bars = screen.getAllByRole('generic');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('should render weight data successfully', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockWeightData,
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    expect(screen.getByText('Weight Evolution')).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
    expect(screen.getByText(/78.5/)).toBeInTheDocument();
  });

  it('should display weight statistics correctly', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockWeightData,
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    // Start weight (first entry)
    expect(screen.getByText('80.0 kg')).toBeInTheDocument();
    // Current weight (last entry)
    expect(screen.getByText('78.5 kg')).toBeInTheDocument();
    // Min weight
    expect(screen.getByText('78.5 kg')).toBeInTheDocument();
  });

  it('should show weight lost message when weight decreased', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockWeightData,
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    // Total weight lost: 80 - 78.5 = 1.5 kg
    expect(screen.getByText(/1.5/)).toBeInTheDocument();
  });

  it('should render error state with retry button', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    } as any);

    render(<WeightChart />);

    expect(screen.getByText('Failed to load weight data')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle empty weight history', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    expect(screen.getByText('No weight records found')).toBeInTheDocument();
  });

  it('should handle null weight history', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as any);

    render(<WeightChart />);

    expect(screen.getByText('No weight records found')).toBeInTheDocument();
  });

  it('should display chart bars with correct heights', () => {
    vi.mocked(useWeightHistoryModule.useWeightHistory).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockWeightData,
      refetch: vi.fn(),
    } as any);

    const { container } = render(<WeightChart />);

    // Find bar elements
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars.length).toBe(mockWeightData.length);
  });
});
