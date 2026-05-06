import httpClient from '@/core/http/httpClient';
import type { LogFoodRequest, LogFoodResponse } from '../types/tracking.types';

export const trackingService = {
  logFood: async (data: LogFoodRequest): Promise<LogFoodResponse> => {
    // ¡Aquí estaba el detalle! Cambiamos /food por /meal
    const response = await httpClient.post<LogFoodResponse>('/tracking/logs/meal', data);
    return response.data;
  },
  
  getTodayLogs: async () => {
    const response = await httpClient.get('/tracking/logs/today');
    return response.data;
  },

  searchFood: async (query: string) => {
    const response = await httpClient.get(`/tracking/catalog/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }
};