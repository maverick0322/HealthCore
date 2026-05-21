import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AvailabilitySlotResponse, GenerateSlotsRequest } from '../types/agenda.types';

export const useGenerateSlots = () => {
  const { t } = useTranslation('nutritionist');
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const generateSlots = async (payload: GenerateSlotsRequest) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const data = await nutritionistAgendaService.generateSlots(payload);
      setSlots(data);
      setIsSuccess(true);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setError(t('availability.errorGenerateSlotsConflict'));
        } else if (status === 400) {
          setError(t('availability.errorGenerateSlotsInvalid'));
        } else {
          setError(t('availability.errorGenerateSlotsUnexpected'));
        }
      } else {
        setError(t('availability.errorGenerateSlotsUnexpected'));
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateSlots, slots, isLoading, error, isSuccess };
};
