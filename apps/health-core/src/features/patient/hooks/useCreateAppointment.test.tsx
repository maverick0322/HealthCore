import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { useCreateAppointment } from './useCreateAppointment';
import { agendaService } from '../services/agendaService';

vi.mock('../services/agendaService', () => ({
  agendaService: {
    createAppointment: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps weekly limit conflicts to a dedicated message', async () => {
    vi.mocked(agendaService.createAppointment).mockRejectedValue(
      new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as never,
        data: {
          code: 'CONFLICT',
          message: 'El paciente ya tiene una cita activa dentro de los proximos 7 dias',
        },
      }),
    );

    const { result } = renderHook(() => useCreateAppointment());

    await act(async () => {
      await expect(
        result.current.createAppointment({
          slotId: 'slot-1',
          nutritionistId: 'nutri-1',
          slotVersion: 1,
          locale: 'es-MX',
        }),
      ).rejects.toBeInstanceOf(axios.AxiosError);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('appointments.errorBookWeeklyLimit');
    });
  });
});
