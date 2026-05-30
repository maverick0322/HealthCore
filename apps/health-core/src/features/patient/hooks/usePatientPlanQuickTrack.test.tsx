import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogFood } = vi.hoisted(() => ({
  mockLogFood: vi.fn(),
}));

let mockIsLoading = false;
let mockError: string | null = null;
let mockIsSuccess = false;

vi.mock('@/features/tracking/hooks/useLogFood', () => ({
  useLogFood: () => ({
    logFood: mockLogFood,
    isLoading: mockIsLoading,
    error: mockError,
    isSuccess: mockIsSuccess,
  }),
}));

import { usePatientPlanQuickTrack } from './usePatientPlanQuickTrack';

describe('usePatientPlanQuickTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsLoading = false;
    mockError = null;
    mockIsSuccess = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps the nutrition plan payload to tracking payload', async () => {
    const { result } = renderHook(() => usePatientPlanQuickTrack());

    await act(async () => {
      await result.current.handleQuickTrack({
        mealSlot: 'BREAKFAST',
        optionName: 'Oat bowl',
        ingredients: [
          {
            barcode: '123',
            name: 'Oats',
            baseCaloriesPer100Units: 389,
            quantityAmount: 45,
          },
        ],
      });
    });

    expect(mockLogFood).toHaveBeenCalledWith(
      expect.objectContaining({
        mealName: 'Oat bowl',
        mealType: 'BREAKFAST',
        consumedAt: expect.any(String),
        foods: [
          {
            barcode: '123',
            name: 'Oats',
            baseCalories: 389,
            grams: 45,
          },
        ],
      }),
    );
  });

  it('shows and clears success feedback after a successful log', async () => {
    const { result, rerender } = renderHook(() => usePatientPlanQuickTrack());

    mockIsSuccess = true;
    act(() => {
      rerender();
    });

    expect(result.current.quickTrackFeedback).toEqual({
      type: 'success',
      message: '\u00a1Platillo registrado en tu diario exitosamente!',
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.quickTrackFeedback).toBeNull();
  });

  it('shows and clears error feedback when food logging fails', async () => {
    const { result, rerender } = renderHook(() => usePatientPlanQuickTrack());

    mockError = 'tracking.error';
    act(() => {
      rerender();
    });

    expect(result.current.quickTrackFeedback).toEqual({
      type: 'error',
      message: 'tracking.error',
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.quickTrackFeedback).toBeNull();
  });
});
