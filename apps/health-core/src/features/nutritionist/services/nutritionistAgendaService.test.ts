import { beforeEach, describe, expect, it, vi } from 'vitest';

import httpClient from '@/core/http/httpClient';

import { nutritionistAgendaService } from './nutritionistAgendaService';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('nutritionistAgendaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates slots with required duration', async () => {
    const payload = {
      timeZone: 'America/Mexico_City',
      durationMinutes: 30,
      days: [
        {
          date: '2026-05-01',
          blocks: [{ startTime: '09:00', endTime: '13:00' }],
        },
      ],
    };
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

    await nutritionistAgendaService.generateSlots(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/agenda/nutritionist/slots/generate', payload);
  });

  it('fetches slots and appointments by range and deactivates slots', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await nutritionistAgendaService.getMySlots('from', 'to');
    await nutritionistAgendaService.getMyAppointments('from', 'to');
    await nutritionistAgendaService.deactivateSlot('slot-1');

    expect(httpClient.get).toHaveBeenCalledWith('/agenda/nutritionist/slots', {
      params: { from: 'from', to: 'to' },
    });
    expect(httpClient.get).toHaveBeenCalledWith('/agenda/nutritionist/appointments', {
      params: { from: 'from', to: 'to' },
    });
    expect(httpClient.patch).toHaveBeenCalledWith('/agenda/nutritionist/slots/slot-1/deactivate');
  });
});
