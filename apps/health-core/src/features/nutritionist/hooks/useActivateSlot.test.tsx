import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { useActivateSlot } from './useActivateSlot';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';

vi.mock('../services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    activateSlot: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useActivateSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activates a slot successfully', async () => {
    vi.mocked(nutritionistAgendaService.activateSlot).mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivateSlot());

    await act(async () => {
      await result.current.activateSlot('slot-1');
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('maps 409 responses to the forbidden activation message', async () => {
    vi.mocked(nutritionistAgendaService.activateSlot).mockRejectedValue(
      new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as never,
        data: {},
      }),
    );

    const { result } = renderHook(() => useActivateSlot());

    await act(async () => {
      await expect(result.current.activateSlot('slot-1')).rejects.toBeInstanceOf(axios.AxiosError);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('availability.errorActivateSlotForbidden');
    });
  });
});
