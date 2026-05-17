import { useState, useEffect, useCallback } from 'react';
import { trackingService } from '../services/trackingService';
import type { TodayDashboardSummary } from '../types/tracking.types';

export const useTodaySummary = () => {
  const [summary, setSummary] = useState<TodayDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await trackingService.getTodaySummary();
      setSummary(data);
    } catch (err) {
      setError('No se pudo cargar el resumen nutricional de hoy.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWater = async (amountMl: number) => {
    try {
      await trackingService.logWater({ amountMl });
      await fetchSummary(); // Recargamos para actualizar la UI
    } catch (err) {
      console.error("Error registrando agua", err);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, addWater };
};