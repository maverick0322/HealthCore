import { useState } from 'react';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AvailabilitySlotResponse, GenerateSlotsRequest } from '../types/agenda.types';

export const useGenerateSlots = () => {
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
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        'Error generating slots.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateSlots, slots, isLoading, error, isSuccess };
};
