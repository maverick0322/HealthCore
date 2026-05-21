import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse } from '../types/agenda.types';

/**
 * Hook to list the authenticated patient's appointments.
 */
export const usePatientAppointments = () => {
  const { t } = useTranslation('patient');
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await agendaService.getMyAppointments();
      setAppointments(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(t('appointments.errorLoadAppointments'));
      } else {
        setError(t('appointments.errorLoadAppointments'));
      }
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { appointments, isLoading, error, fetchAppointments };
};
