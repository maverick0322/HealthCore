import { useState, useCallback } from 'react';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AvailabilitySlotResponse } from '../types/agenda.types';

export const useNutritionistSlots = () => {
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionistAgendaService.getMySlots(from, to);
      setSlots(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        'Error fetching slots.';
      setError(msg);
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { slots, isLoading, error, fetchSlots };
};
