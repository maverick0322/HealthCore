import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { trackingService } from '../services/trackingService';

export const useDailyLogs = (date: string) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (targetDate: string) => {
    if (!targetDate) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await trackingService.getDailyLogs(targetDate);
      setLogs(data || []);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar el historial del día.');
      } else if (err instanceof Error) {
        setError(`Error interno: ${err.message}`);
      } else {
        setError('Ocurrió un error inesperado al consultar el historial.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs(date);
  }, [date, fetchLogs]);

  return { logs, isLoading, error, refetch: () => fetchLogs(date) };
};