import { useState } from 'react';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse, CreateAppointmentRequest } from '../types/agenda.types';

/**
 * Hook to create (book) an appointment on a specific slot.
 */
export const useCreateAppointment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);

  const createAppointment = async (payload: CreateAppointmentRequest) => {
    setIsLoading(true);
    setError(null);
    setAppointment(null);
    try {
      const data = await agendaService.createAppointment(payload);
      setAppointment(data);
      return data;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string, error?: string } } };
      const msg =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        'Error creating appointment.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createAppointment, isLoading, error, appointment };
};
