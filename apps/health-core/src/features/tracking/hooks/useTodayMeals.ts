import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { trackingService } from '../services/trackingService';

export const useTodayMeals = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await trackingService.getTodayLogs();
      setMeals(response.data || []);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar los alimentos de hoy.');
      } else {
        setError('Ocurrió un fallo inesperado al recuperar el historial diario.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMeals();
  }, [fetchMeals]);

  return { meals, isLoading, error, refetch: fetchMeals };
};