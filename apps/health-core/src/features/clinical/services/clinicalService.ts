import type { CreateProfilePayload, HealthGoalResponse, WeightRecord } from '../types/clinical.types';
import httpClient from '@/core/http/httpClient';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { extractUserIdFromToken } from '@/core/utils/jwt';

const CLINICAL_API_URL = '/clinical';

/**
 * Get the X-User-Id header value by extracting userId from JWT token.
 * This header is required by the Clinical Service for all endpoints.
 *
 * @throws {Error} If user is not authenticated or token is invalid
 */
const getXUserIdHeader = (): Record<string, string> => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('User is not authenticated. No access token found.');
  }

  let userId: string;
  try {
    userId = extractUserIdFromToken(accessToken);
  } catch (error) {
    throw new Error('Invalid or malformed access token. Cannot extract user ID.');
  }

  if (!userId) {
    throw new Error('User ID not found in token.');
  }

  return { 'X-User-Id': userId };
};

export const clinicalApi = {
  createProfile: async (payload: CreateProfilePayload): Promise<void> => {
    await httpClient.post(
      `${CLINICAL_API_URL}/profile`,
      payload,
      { headers: getXUserIdHeader() }
    );
  },

  getMyGoals: async (): Promise<HealthGoalResponse> => {
    const response = await httpClient.get<HealthGoalResponse>(
      `${CLINICAL_API_URL}/goals/me`,
      { headers: getXUserIdHeader() }
    );
    return response.data;
  },

  updateWeight: async (weightKg: number): Promise<HealthGoalResponse> => {
    const response = await httpClient.post<HealthGoalResponse>(
      `${CLINICAL_API_URL}/weight`,
      { weightKg },
      { headers: getXUserIdHeader() }
    );
    return response.data;
  },

  getWeightHistory: async (): Promise<WeightRecord[]> => {
    const response = await httpClient.get<WeightRecord[]>(
      `${CLINICAL_API_URL}/weight/history`,
      { headers: getXUserIdHeader() }
    );
    return response.data;
  },
};