import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { agendaService } from '../services/agendaService';
import type { AppointmentResponse, CreateAppointmentRequest } from '../types/agenda.types';
import { isWeeklyAppointmentLimitConflict } from './appointmentErrorUtils';

/**
 * Hook to create (book) an appointment on a specific slot.
 */
export const useCreateAppointment = () => {
  const { t } = useTranslation('patient');
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
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 503) {
          setError(t('appointments.errorServiceUnavailable'));
        } else if (status === 409) {
          setError(
            isWeeklyAppointmentLimitConflict(err)
              ? t('appointments.errorBookWeeklyLimit')
              : t('appointments.errorBookSlotTaken'),
          );
        } else if (status === 404) {
          setError(t('appointments.errorBookSlotNotFound'));
        } else if (status === 403) {
          setError(t('appointments.errorBookForbidden'));
        } else if (status === 400) {
          setError(t('appointments.errorBookInvalid'));
        } else {
          setError(t('appointments.errorBookUnexpected'));
        }
      } else {
        setError(t('appointments.errorBookUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createAppointment, isLoading, error, appointment };
};
