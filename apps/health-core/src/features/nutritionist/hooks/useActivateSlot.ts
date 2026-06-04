import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { nutritionistAgendaService } from '../services/nutritionistAgendaService';

export const useActivateSlot = () => {
  const { t } = useTranslation('nutritionist');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activateSlot = async (slotId: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await nutritionistAgendaService.activateSlot(slotId);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403 || status === 409) {
          setError(t('availability.errorActivateSlotForbidden'));
        } else if (status === 404) {
          setError(t('availability.errorActivateSlotNotFound'));
        } else {
          setError(t('availability.errorActivateSlotUnexpected'));
        }
      } else {
        setError(t('availability.errorActivateSlotUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { activateSlot, isLoading, error, isSuccess };
};
