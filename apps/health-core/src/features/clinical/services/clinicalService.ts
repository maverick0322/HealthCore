import type { CreateProfilePayload, HealthGoalResponse } from '../types/clinical.types';

import httpClient from '@/core/http/httpClient';

const CLINICAL_API_URL = '/api/v1/clinical';

export const clinicalApi = {
  
  createProfile: async (payload: CreateProfilePayload): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/profile`, payload);
  },

  getMyGoals: async (): Promise<HealthGoalResponse> => {
    const response = await httpClient.get<HealthGoalResponse>(`${CLINICAL_API_URL}/goals/me`);
    return response.data;
  }
};