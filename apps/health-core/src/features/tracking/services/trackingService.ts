import httpClient from '@/core/http/httpClient';
import type { 
  LogFoodRequest, 
  LogFoodResponse,
  LogWaterRequest,
  WaterLogResponse,
  TodayDashboardSummary,
  DailyMacroSummary
} from '../types/tracking.types';

export const trackingService = {
  logFood: async (data: LogFoodRequest): Promise<LogFoodResponse> => {
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
  },

  logWater: async (data: LogWaterRequest): Promise<WaterLogResponse> => {
    const response = await httpClient.post<WaterLogResponse>('/tracking/logs/water', data);
    return response.data;
  },

  // -- CQRS Queries ---
  getTodaySummary: async (date?: string): Promise<TodayDashboardSummary> => {
    const url = date ? `/tracking/dashboard/today?date=${date}` : '/tracking/dashboard/today';
    const response = await httpClient.get<TodayDashboardSummary>(url);
    return response.data;
  },

  getDailyLogs: async (date: string) => {
    const response = await httpClient.get(`/tracking/logs/daily?date=${date}`);
    return response.data;
  },

  getHistoricalMacros: async (startDate: string, endDate: string): Promise<DailyMacroSummary[]> => {
    const response = await httpClient.get<DailyMacroSummary[]>(
      `/tracking/dashboard/history?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }
};