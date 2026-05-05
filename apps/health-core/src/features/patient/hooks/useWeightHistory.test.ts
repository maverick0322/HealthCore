import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeightHistory, transformWeightDataForChart } from './useWeightHistory';
import * as clinicalServiceModule from '@/features/clinical/services/clinicalService';

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryFn }) => {
    const result = queryFn();
    if (result instanceof Promise) {
      return {
        isLoading: false,
        isError: false,
        data: undefined,
      };
    }
    return {
      isLoading: false,
      isError: false,
      data: result,
    };
  }),
}));

describe('useWeightHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch weight history successfully', async () => {
    const mockData = [
      { weightKg: 80, date: '2024-01-01' },
      { weightKg: 79.5, date: '2024-01-08' },
      { weightKg: 79, date: '2024-01-15' },
    ];

    vi.mocked(clinicalServiceModule.clinicalApi.getWeightHistory).mockResolvedValue(mockData);

    const { result } = renderHook(() => useWeightHistory());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getWeightHistory).toHaveBeenCalled();
    });
  });

  it('should handle empty weight history', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getWeightHistory).mockResolvedValue([]);

    const { result } = renderHook(() => useWeightHistory());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getWeightHistory).toHaveBeenCalled();
    });
  });
});

describe('transformWeightDataForChart', () => {
  it('should transform weight data correctly', () => {
    const input = [
      { weightKg: 80, date: '2024-01-01' },
      { weightKg: 79.5, date: '2024-01-08' },
      { weightKg: 79, date: '2024-01-15' },
    ];

    const result = transformWeightDataForChart(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('weight', 80);
    expect(result[0]).toHaveProperty('fullDate', '2024-01-01');
    expect(result[0]).toHaveProperty('date');
  });

  it('should return empty array for undefined data', () => {
    const result = transformWeightDataForChart(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty data', () => {
    const result = transformWeightDataForChart([]);
    expect(result).toEqual([]);
  });

  it('should format dates in Spanish locale', () => {
    const input = [
      { weightKg: 80, date: '2024-01-01' },
    ];

    const result = transformWeightDataForChart(input);

    // Spanish locale date format
    expect(result[0].date).toMatch(/\d+\s+\w+/);
  });
});
