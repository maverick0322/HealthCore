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
 * - Strict Typing: Replaces 'any' with 'MealLogDTO' to guarantee compile-time safety.
 * - Defensive Data Handling: Validates that the API payload is an actual array before updating the state, 
 * preventing ".map is not a function" crashes in the UI if the backend returns null.
 * - Performance: Maintains useCallback to prevent infinite render loops if 'refetch' is passed as a prop.
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
      
      // Defensive check: Ensure we always work with an array, even if the API contract is violated
      const payload = Array.isArray(response.data) ? response.data : [];
      setMeals(payload);
      
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar los alimentos de hoy.');
      } else {
        // Fallback for non-HTTP errors (e.g., network drops, runtime JS errors)
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