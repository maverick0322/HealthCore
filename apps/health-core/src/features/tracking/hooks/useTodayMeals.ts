import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { trackingService } from '../services/trackingService';
import type { MealLogDTO } from '../types/tracking.types';

interface UseTodayMealsReturn {
  meals: MealLogDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to orchestrate fetching and state management for daily meal logs.
 * Design Decisions:
 * - Robust Data Unwrapping: Handles both raw array responses and wrapped Axios responses.
 * This prevents silent failures if the service layer's contract changes.
 */
export const useTodayMeals = (): UseTodayMealsReturn => {
  const [meals, setMeals] = useState<MealLogDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trackingService.getTodayLogs();
      
      // Defensive Design: Safely extract the array regardless of the HTTP client's unwrapping strategy
      let payload: MealLogDTO[] = [];
      
      if (Array.isArray(response)) {
        // Case A: The service layer already extracted the 'data' property (Axios default behavior)
        payload = response;
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        // Case B: The hook received the raw AxiosResponse wrapper
        payload = (response as any).data;
      }
      
      setMeals(payload);
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