import { useState } from 'react';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';

export const useDeactivateSlot = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const deactivateSlot = async (slotId: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await nutritionistAgendaService.deactivateSlot(slotId);
      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string, error?: string } } };
      const msg =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        'Error deactivating slot.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deactivateSlot, isLoading, error, isSuccess };
};
