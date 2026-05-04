import type { CreateProfilePayload, HealthGoalResponse, WeightRecord } from '../types/clinical.types';
import httpClient from '@/core/http/httpClient';

const CLINICAL_API_URL = '/clinical';

export const clinicalApi = {
  
  createProfile: async (payload: CreateProfilePayload): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/profile`, payload);
  },

  getMyGoals: async (): Promise<HealthGoalResponse> => {
    const response = await httpClient.get<HealthGoalResponse>(`${CLINICAL_API_URL}/goals/me`);
    return response.data;
  },

  updateWeight: async (weightKg: number): Promise<HealthGoalResponse> => {
    const response = await httpClient.post<HealthGoalResponse>(`${CLINICAL_API_URL}/weight`, { weightKg });
    return response.data;
  },

  getWeightHistory: async (): Promise<WeightRecord[]> => {
    const response = await httpClient.get<WeightRecord[]>(`${CLINICAL_API_URL}/weight/history`);
    return response.data;
  }
};