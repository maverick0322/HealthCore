import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
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
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const serverMessage = err.response?.data?.message || 'Error de conexión con el servidor.';
        setError(`No se pudo cargar el resumen: ${serverMessage}`);
      } else if (err instanceof Error) {
        setError(`Error interno: ${err.message}`);
      } else {
        setError('Ocurrió un error desconocido al cargar el resumen nutricional.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWater = async (amountMl: number) => {
    try {
      await trackingService.logWater({ amountMl });
      await fetchSummary(); // Recargamos para actualizar la UI
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const serverMessage = err.response?.data?.message || 'Error de red.';
        throw new Error(`Error registrando agua: ${serverMessage}`);
      }
      throw new Error('Error desconocido al registrar agua.');
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, addWater };
};