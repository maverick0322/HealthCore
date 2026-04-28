import { useState } from 'react';
import { agendaService } from '../services/agendaService';

/**
 * Hook to cancel an existing appointment.
 */
export const useCancelAppointment = () => {
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
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        'Error cancelling appointment.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelAppointment, isLoading, error, isSuccess };
};
