import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse, RescheduleAppointmentRequest } from '../types/agenda.types';

/**
 * Hook to reschedule an existing appointment to a new slot.
 */
export const useRescheduleAppointment = () => {
  const { t } = useTranslation('patient');
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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 503) {
          setError(t('appointments.errorServiceUnavailable'));
        } else if (status === 409) {
          setError(t('appointments.errorRescheduleSlotTaken'));
        } else if (status === 404) {
          setError(t('appointments.errorRescheduleNotFound'));
        } else if (status === 403) {
          setError(t('appointments.errorRescheduleForbidden'));
        } else if (status === 400) {
          setError(t('appointments.errorRescheduleInvalid'));
        } else {
          setError(t('appointments.errorRescheduleUnexpected'));
        }
      } else {
        setError(t('appointments.errorRescheduleUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { rescheduleAppointment, isLoading, error, appointment };
};
