import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AvailabilitySlotResponse } from '../types/agenda.types';

export const useNutritionistSlots = () => {
  const { t } = useTranslation('nutritionist');
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionistAgendaService.getMySlots(from, to);
      setSlots(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(t('availability.errorLoadSlots'));
      } else {
        setError(t('availability.errorLoadSlots'));
      }
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { slots, isLoading, error, fetchSlots };
};
