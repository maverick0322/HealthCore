import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { agendaService } from '../services/agendaService';

/**
 * Hook to cancel an existing appointment.
 */
export const useCancelAppointment = () => {
  const { t } = useTranslation('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const cancelAppointment = async (appointmentId: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await agendaService.cancelAppointment(appointmentId);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 503) {
          setError(t('appointments.errorServiceUnavailable'));
        } else if (status === 404) {
          setError(t('appointments.errorCancelNotFound'));
        } else if (status === 403) {
          setError(t('appointments.errorCancelForbidden'));
        } else {
          setError(t('appointments.errorCancelUnexpected'));
        }
      } else {
        setError(t('appointments.errorCancelUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelAppointment, isLoading, error, isSuccess };
};
