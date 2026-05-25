import { useState, useEffect, useCallback } from 'react';
import { trackingService } from '../services/trackingService';
import type { DailyMacroSummary } from '../types/tracking.types';

export const useHistoricalMacros = (startDate: string, endDate: string) => {
  const [data, setData] = useState<DailyMacroSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await trackingService.getHistoricalMacros(startDate, endDate);
      setData(response || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial de macros.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return { data, isLoading, error, refetch: fetchHistory };
};