import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { useRescheduleAppointment } from './useRescheduleAppointment';
import { agendaService } from '../services/agendaService';

vi.mock('../services/agendaService', () => ({
  agendaService: {
    rescheduleAppointment: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useRescheduleAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps weekly limit conflicts to a dedicated reschedule message', async () => {
    vi.mocked(agendaService.rescheduleAppointment).mockRejectedValue(
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

    const { result } = renderHook(() => useRescheduleAppointment());

    await act(async () => {
      await expect(
        result.current.rescheduleAppointment('app-1', {
          newSlotId: 'slot-2',
          newSlotVersion: 2,
          locale: 'es-MX',
        }),
      ).rejects.toBeInstanceOf(axios.AxiosError);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('appointments.errorRescheduleWeeklyLimit');
    });
  });
});
