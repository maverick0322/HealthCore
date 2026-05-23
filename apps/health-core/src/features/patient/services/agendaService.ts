import httpClient from '@/core/http/httpClient';
import type {
  AppointmentResponse,
  AvailabilitySlotResponse,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from '../types/agenda.types';

/**
 * Patient-facing agenda service.
 *
 * All calls are forwarded through the shared `httpClient` which already
 * injects the Bearer token and handles 401 refresh automatically.
 */
export const agendaService = {
  // ── Availability ────────────────────────────────────────────

  /**
   * Fetch available (free) slots for a given nutritionist in a date range.
   */
  getAvailability: async (
    nutritionistId: string,
    from: string,
    to: string,
  ): Promise<AvailabilitySlotResponse[]> => {
    const { data } = await httpClient.get<AvailabilitySlotResponse[]>(
      `/agenda/availability/${nutritionistId}`,
      { params: { from, to } },
    );
    return data;
  },

  // ── Appointments ────────────────────────────────────────────

  /** List the authenticated patient's active / pending appointments. */
  getMyAppointments: async (): Promise<AppointmentResponse[]> => {
    const { data } = await httpClient.get<AppointmentResponse[]>(
      '/agenda/appointments/me',
    );
    return data;
  },

  getMyAppointmentHistory: async (
    from: string,
    to: string,
    statuses?: string[],
  ): Promise<AppointmentResponse[]> => {
    const { data } = await httpClient.get<AppointmentResponse[]>(
      '/agenda/appointments/history',
      { params: { from, to, statuses: statuses?.join(',') } },
    );
    return data;
  },

  /** Book a new appointment on a specific slot. */
  createAppointment: async (
    payload: CreateAppointmentRequest,
  ): Promise<AppointmentResponse> => {
    const { data } = await httpClient.post<AppointmentResponse>(
      '/agenda/appointments',
      payload,
    );
    return data;
  },

  /** Cancel an existing appointment and release its slot. */
  cancelAppointment: async (appointmentId: string): Promise<void> => {
    await httpClient.patch(`/agenda/appointments/${appointmentId}/cancel`);
  },

  /** Reschedule an appointment to a different slot. */
  rescheduleAppointment: async (
    appointmentId: string,
    payload: RescheduleAppointmentRequest,
  ): Promise<AppointmentResponse> => {
    const { data } = await httpClient.put<AppointmentResponse>(
      `/agenda/appointments/${appointmentId}/reschedule`,
      payload,
    );
    return data;
  },
};
