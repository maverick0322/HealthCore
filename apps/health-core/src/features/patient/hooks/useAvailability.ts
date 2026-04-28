import { useState, useCallback } from 'react';
import { agendaService } from '../services/agendaService';
import type { AvailabilitySlotResponse } from '../types/agenda.types';

/**
 * Hook to fetch available slots for a nutritionist in a date range.
 */
export const useAvailability = () => {
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(
    async (nutritionistId: string, from: string, to: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await agendaService.getAvailability(nutritionistId, from, to);
        setSlots(data);
      } catch (err: any) {
        const msg =
          err.response?.data?.message ??
          err.response?.data?.error ??
          'Error fetching availability.';
        setError(msg);
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { slots, isLoading, error, fetchAvailability };
};
