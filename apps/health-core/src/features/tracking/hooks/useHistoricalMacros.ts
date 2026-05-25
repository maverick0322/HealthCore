import { useState, useEffect, useCallback, useMemo } from 'react';
import { trackingService } from '../services/trackingService';
import type { DailyMacroSummary } from '../types/tracking.types';

export const useHistoricalMacros = () => {
  const [data, setData] = useState<DailyMacroSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate, last7Days } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    
    const daysArray = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      last7Days: daysArray
    };
  }, []);

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

  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        caloriesHistory: Array(7).fill(0), 
        caloriesAvg: 0, 
        macrosAvg: { protein: 0, carbs: 0, fat: 0 } 
      };
    }

    const cals = last7Days.map(dateStr => {
      const dayLog = data.find((d: any) => d.date === dateStr); 
      return dayLog ? dayLog.totalCalories : 0;
    });

    const calsAvg = Math.round(cals.reduce((acc, curr) => acc + curr, 0) / 7);

    let totalP = 0, totalC = 0, totalF = 0;
    data.forEach((d: any) => {
      totalP += d.totalProteins || 0;
      totalC += d.totalCarbs || 0;
      totalF += d.totalFats || 0;
    });

    const totalMacros = totalP + totalC + totalF;
    const mAvg = totalMacros > 0 ? {
      protein: Math.round((totalP / totalMacros) * 100),
      carbs: Math.round((totalC / totalMacros) * 100),
      fat: Math.round((totalF / totalMacros) * 100),
    } : { protein: 0, carbs: 0, fat: 0 };

    return { caloriesHistory: cals, caloriesAvg: calsAvg, macrosAvg: mAvg };
  }, [data, last7Days]);

  return { 
    rawLogs: data, 
    caloriesHistory: processedData.caloriesHistory,
    caloriesAvg: processedData.caloriesAvg,
    macrosAvg: processedData.macrosAvg,
    isLoading, 
    error, 
    refetch: fetchHistory 
  };
};