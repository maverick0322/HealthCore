import httpClient from '@/core/http/httpClient';
import type {
  AvailabilitySlotResponse,
  AppointmentResponse,
  GenerateSlotsRequest,
} from '../types/agenda.types';

/**
 * Nutritionist-facing agenda service.
 *
 * Calls forwarded through shared httpClient (Bearer token injected automatically).
 */
export const nutritionistAgendaService = {
  /** Generate availability slots in bulk for the authenticated nutritionist. */
  generateSlots: async (
    payload: GenerateSlotsRequest,
  ): Promise<AvailabilitySlotResponse[]> => {
    const { data } = await httpClient.post<AvailabilitySlotResponse[]>(
      '/agenda/nutritionist/slots/generate',
      payload,
    );
    return data;
  },

  /** List the nutritionist's configured slots within a date range. */
  getMySlots: async (
    from: string,
    to: string,
  ): Promise<AvailabilitySlotResponse[]> => {
    const { data } = await httpClient.get<AvailabilitySlotResponse[]>(
      '/agenda/nutritionist/slots',
      { params: { from, to } },
    );
    return data;
  },

  /** Deactivate (disable) a single slot. */
  deactivateSlot: async (slotId: string): Promise<void> => {
    await httpClient.patch(`/agenda/nutritionist/slots/${slotId}/deactivate`);
  },

  /** List appointments booked with the authenticated nutritionist. */
  getMyAppointments: async (
    from: string,
    to: string,
  ): Promise<AppointmentResponse[]> => {
    const { data } = await httpClient.get<AppointmentResponse[]>(
      '/agenda/nutritionist/appointments',
      { params: { from, to } },
    );
    return data;
  },

  getAppointmentReport: async (
    from: string,
    to: string,
    statuses?: string[],
    patientId?: string,
  ): Promise<AppointmentResponse[]> => {
    const { data } = await httpClient.get<AppointmentResponse[]>(
      '/agenda/nutritionist/reports/appointments',
      { params: { from, to, statuses: statuses?.join(','), patientId } },
    );
    return data;
  },

  getSlotReport: async (
    from: string,
    to: string,
    state = 'all',
  ): Promise<AvailabilitySlotResponse[]> => {
    const { data } = await httpClient.get<AvailabilitySlotResponse[]>(
      '/agenda/nutritionist/reports/slots',
      { params: { from, to, state } },
    );
    return data;
  },
};
