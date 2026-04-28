import { useState, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse } from '../types/agenda.types';

/**
 * Hook to list the authenticated patient's appointments.
 */
export const usePatientAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await agendaService.getMyAppointments();
      setAppointments(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        'Error fetching appointments.';
      setError(msg);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { appointments, isLoading, error, fetchAppointments };
};
