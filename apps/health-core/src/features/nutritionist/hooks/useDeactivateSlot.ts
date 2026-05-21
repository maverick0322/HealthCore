import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';

export const useDeactivateSlot = () => {
  const { t } = useTranslation('nutritionist');
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
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403 || status === 409) {
          setError(t('availability.errorDeactivateSlotForbidden'));
        } else if (status === 404) {
          setError(t('availability.errorDeactivateSlotNotFound'));
        } else {
          setError(t('availability.errorDeactivateSlotUnexpected'));
        }
      } else {
        setError(t('availability.errorDeactivateSlotUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deactivateSlot, isLoading, error, isSuccess };
};
