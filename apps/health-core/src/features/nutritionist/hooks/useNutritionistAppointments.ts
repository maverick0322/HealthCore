import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { nutritionistAgendaService } from '../services/nutritionistAgendaService';
import type { AppointmentResponse } from '../types/agenda.types';

export const useNutritionistAppointments = () => {
  const { t } = useTranslation('nutritionist');
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nutritionistAgendaService.getMyAppointments(from, to);
      setAppointments(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setAppointments([]);
        setError(null);
        return;
      }

      setError(t('availability.errorLoadAppointments'));
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return { appointments, isLoading, error, fetchAppointments };
};
