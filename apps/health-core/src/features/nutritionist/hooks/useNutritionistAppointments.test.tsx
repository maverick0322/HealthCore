import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { useNutritionistAppointments } from './useNutritionistAppointments';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';

vi.mock('../services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    getMyAppointments: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useNutritionistAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty list without error when agenda responds 404', async () => {
    vi.mocked(nutritionistAgendaService.getMyAppointments).mockRejectedValue(
      new axios.AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
        data: {},
      })
    );

    const { result } = renderHook(() => useNutritionistAppointments());

    await act(async () => {
      await result.current.fetchAppointments('2026-05-01T00:00:00.000Z', '2026-05-31T00:00:00.000Z');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
