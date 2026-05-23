import { beforeEach, describe, expect, it, vi } from 'vitest';

import httpClient from '@/core/http/httpClient';

import { agendaService } from './agendaService';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

describe('agendaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches availability for a nutritionist and date range', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

    await agendaService.getAvailability('nutri-1', '2026-05-01T00:00:00.000Z', '2026-05-02T00:00:00.000Z');

    expect(httpClient.get).toHaveBeenCalledWith('/agenda/availability/nutri-1', {
      params: {
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-02T00:00:00.000Z',
      },
    });
  });

  it('creates an appointment with the linked nutritionist payload', async () => {
    const payload = {
      slotId: 'slot-1',
      nutritionistId: 'nutri-1',
      slotVersion: 1,
      locale: 'en',
    };
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 'app-1' } });

    await agendaService.createAppointment(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/agenda/appointments', payload);
  });

  it('reschedules and cancels appointments through agenda endpoints', async () => {
    const payload = { newSlotId: 'slot-2', newSlotVersion: 2, locale: 'es' };
    (httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 'app-1' } });
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

    await agendaService.rescheduleAppointment('app-1', payload);
    await agendaService.cancelAppointment('app-1');
    await agendaService.getMyAppointmentHistory('from', 'to', ['CONFIRMED', 'ATTENDED']);

    expect(httpClient.put).toHaveBeenCalledWith('/agenda/appointments/app-1/reschedule', payload);
    expect(httpClient.patch).toHaveBeenCalledWith('/agenda/appointments/app-1/cancel');
    expect(httpClient.get).toHaveBeenCalledWith('/agenda/appointments/history', {
      params: { from: 'from', to: 'to', statuses: 'CONFIRMED,ATTENDED' },
    });
  });
});
