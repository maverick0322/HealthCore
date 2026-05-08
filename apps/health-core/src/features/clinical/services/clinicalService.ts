import type { CreateProfilePayload, HealthGoalResponse, WeightRecord } from '../types/clinical.types';
import type { ObservationResponse, CreateObservationRequest } from '../types/clinical.types';

import httpClient from '@/core/http/httpClient';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { extractUserIdFromToken } from '@/core/utils/jwt';

const CLINICAL_API_URL = '/clinical'; // Base URL for clinical API

/**
 * Get the X-User-Id header value by extracting userId from JWT token.
 * This header is required by the Clinical Service for all endpoints.
 *
 * @throws {Error} If user is not authenticated or token is invalid
 */
const getXUserIdHeader = (userId?: string): Record<string, string> => {
  if (userId) {
    return { 'X-User-Id': userId };
  }

  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('User is not authenticated. No access token found.');
  }

  let resolvedUserId: string;
  try {
    resolvedUserId = extractUserIdFromToken(accessToken);
  } catch (error) {
    throw new Error('Invalid or malformed access token. Cannot extract user ID.');
  }

  if (!resolvedUserId) {
    throw new Error('User ID not found in token.');
  }

  return { 'X-User-Id': resolvedUserId };
};

export const clinicalApi = {
  createProfile: async (payload: CreateProfilePayload, userId?: string): Promise<void> => {
    await httpClient.post(
      `${CLINICAL_API_URL}/profile`,
      payload,
      { headers: getXUserIdHeader(userId) }
    );
  },

  getMyGoals: async (userId?: string): Promise<HealthGoalResponse> => {
    const response = await httpClient.get<HealthGoalResponse>(
      `${CLINICAL_API_URL}/goals/me`,
      { headers: getXUserIdHeader(userId) }
    );
    return response.data;
  },

  updateWeight: async (weightKg: number, userId?: string): Promise<HealthGoalResponse> => {
    const response = await httpClient.post<HealthGoalResponse>(
      `${CLINICAL_API_URL}/weight`,
      { weightKg },
      { headers: getXUserIdHeader(userId) }
    );
    return response.data;
  },

  getWeightHistory: async (userId?: string): Promise<WeightRecord[]> => {
    const response = await httpClient.get<WeightRecord[]>(
      `${CLINICAL_API_URL}/weight/history`,
      { headers: getXUserIdHeader(userId) }
    );
    return response.data;
  },
};

export const createObservation = async (data: CreateObservationRequest): Promise<ObservationResponse> => {
  const response = await httpClient.post<ObservationResponse>('/clinical/observations', data);
  return response.data;
};

export const getPatientObservations = async (patientId: string): Promise<ObservationResponse[]> => {
  const response = await httpClient.get<ObservationResponse[]>(`/clinical/observations/patient/${patientId}`);
  return response.data;
};