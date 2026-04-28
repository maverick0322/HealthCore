import { useState, useCallback } from 'react';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AppointmentResponse } from '../types/agenda.types';

export const useNutritionistAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionistAgendaService.getMyAppointments(from, to);
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
