import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { agendaService } from '../services/agendaService';
import type { AvailabilitySlotResponse } from '../types/agenda.types';

/**
 * Hook to fetch available slots for a nutritionist in a date range.
 */
export const useAvailability = () => {
  const { t } = useTranslation('patient');
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
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(t('appointments.errorLoadAvailability'));
        } else {
          setError(t('appointments.errorLoadAvailability'));
        }
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  return { slots, isLoading, error, fetchAvailability };
};
