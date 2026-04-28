import { useState } from 'react';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse, RescheduleAppointmentRequest } from '../types/agenda.types';

/**
 * Hook to reschedule an existing appointment to a new slot.
 */
export const useRescheduleAppointment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);

  const rescheduleAppointment = async (
    appointmentId: string,
    payload: RescheduleAppointmentRequest,
  ) => {
    setIsLoading(true);
    setError(null);
    setAppointment(null);
    try {
      const data = await agendaService.rescheduleAppointment(appointmentId, payload);
      setAppointment(data);
      return data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        'Error rescheduling appointment.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { rescheduleAppointment, isLoading, error, appointment };
};
