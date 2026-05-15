import type {
  CreateProfilePayload,
  HealthGoalResponse,
  WeightRecord,
  PatientProfileResponse,
  NutritionistPatientProfileResponse,
  NutritionistProfilePayload,
  NutritionistProfileResponse,
  ObservationResponse,
  CreateObservationRequest,
} from '../types/clinical.types';

import httpClient from '@/core/http/httpClient';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { extractUserIdFromToken } from '@/core/utils/jwt';

const CLINICAL_API_URL = '/clinical';
const DEFAULT_GENDER = 'MALE';
const DEFAULT_ACTIVITY_LEVEL = 'SEDENTARY';
const DEFAULT_PATIENT_GOAL = 'health';
const DEFAULT_DIET_TYPE = 'omnivore';

const normalizePatientProfile = (
  profile: Partial<PatientProfileResponse> & Pick<PatientProfileResponse, 'userId'>
): PatientProfileResponse => ({
  userId: profile.userId,
  firstName: profile.firstName ?? '',
  paternalLastName: profile.paternalLastName ?? '',
  maternalLastName: profile.maternalLastName ?? '',
  fullName: profile.fullName ?? null,
  weightKg: profile.weightKg ?? 72.5,
  heightCm: profile.heightCm ?? 175,
  birthDate: profile.birthDate ?? '',
  gender: profile.gender ?? DEFAULT_GENDER,
  activityLevel: profile.activityLevel ?? DEFAULT_ACTIVITY_LEVEL,
  goal: profile.goal ?? DEFAULT_PATIENT_GOAL,
  dietType: profile.dietType ?? DEFAULT_DIET_TYPE,
  allergies: profile.allergies ?? [],
  excludedFoods: profile.excludedFoods ?? [],
  nutritionistId: profile.nutritionistId ?? null,
  profileCompleted: profile.profileCompleted ?? false,
});

const normalizeNutritionistProfile = (
  profile: Partial<NutritionistProfileResponse> & Pick<NutritionistProfileResponse, 'userId'>
): NutritionistProfileResponse => ({
  userId: profile.userId,
  firstName: profile.firstName ?? '',
  paternalLastName: profile.paternalLastName ?? '',
  maternalLastName: profile.maternalLastName ?? '',
  fullName: profile.fullName ?? null,
  specializations: profile.specializations ?? [],
  customSpecialization: profile.customSpecialization ?? '',
  professionalLicense: profile.professionalLicense ?? '',
  consultationTypes: profile.consultationTypes ?? [],
  phone: profile.phone ?? '',
  clinicAddress: profile.clinicAddress ?? null,
  bio: profile.bio ?? '',
  profileCompleted: profile.profileCompleted ?? false,
});

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
  } catch {
    throw new Error('Invalid or malformed access token. Cannot extract user ID.');
  }

  if (!resolvedUserId) {
    throw new Error('User ID not found in token.');
  }

  return { 'X-User-Id': resolvedUserId };
};

export const clinicalApi = {
  createProfile: async (payload: CreateProfilePayload, userId?: string): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/profile`, payload, {
      headers: getXUserIdHeader(userId),
    });
  },

  updateMyProfile: async (payload: CreateProfilePayload): Promise<PatientProfileResponse> => {
    const response = await httpClient.put<PatientProfileResponse>(
      `${CLINICAL_API_URL}/profile/me`,
      payload,
      { headers: getXUserIdHeader() }
    );
    return normalizePatientProfile(response.data);
  },

  getMyProfile: async (userId?: string): Promise<PatientProfileResponse> => {
    const response = await httpClient.get<PatientProfileResponse>(
      `${CLINICAL_API_URL}/profile/me`,
      { headers: getXUserIdHeader(userId) }
    );
    return normalizePatientProfile(response.data);
  },

  getMyLinkedNutritionistProfile: async (): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.get<NutritionistProfileResponse>(
      `${CLINICAL_API_URL}/profile/me/nutritionist`,
      { headers: getXUserIdHeader() }
    );
    return normalizeNutritionistProfile(response.data);
  },

  createNutritionistProfile: async (payload: NutritionistProfilePayload): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/nutritionist/profile`, payload, {
      headers: getXUserIdHeader(),
    });
  },

  updateMyNutritionistProfile: async (
    payload: NutritionistProfilePayload
  ): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.put<NutritionistProfileResponse>(
      `${CLINICAL_API_URL}/nutritionist/profile/me`,
      payload,
      { headers: getXUserIdHeader() }
    );
    return normalizeNutritionistProfile(response.data);
  },

  getMyNutritionistProfile: async (): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.get<NutritionistProfileResponse>(
      `${CLINICAL_API_URL}/nutritionist/profile/me`,
      { headers: getXUserIdHeader() }
    );
    return normalizeNutritionistProfile(response.data);
  },

  getNutritionistPatients: async (): Promise<NutritionistPatientProfileResponse[]> => {
    const response = await httpClient.get<NutritionistPatientProfileResponse[]>(
      `${CLINICAL_API_URL}/nutritionist/patients`,
      { headers: getXUserIdHeader() }
    );
    return response.data.map(normalizePatientProfile);
  },

  getNutritionistPatientProfile: async (
    patientId: string
  ): Promise<NutritionistPatientProfileResponse> => {
    const response = await httpClient.get<NutritionistPatientProfileResponse>(
      `${CLINICAL_API_URL}/nutritionist/patients/${encodeURIComponent(patientId)}`,
      { headers: getXUserIdHeader() }
    );
    return normalizePatientProfile(response.data);
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

  generateLinkingCode: async (): Promise<{ code: string; expiresInSeconds: number }> => {
    const response = await httpClient.post(
      `${CLINICAL_API_URL}/linking/generate`,
      {},
      { headers: getXUserIdHeader() }
    );
    return response.data;
  },

  getCurrentLinkingCode: async (): Promise<{ code: string; expiresInSeconds: number } | null> => {
    const response = await httpClient.get(`${CLINICAL_API_URL}/linking/current`, {
      headers: getXUserIdHeader(),
    });
    if (response.status === 204) {
      return null;
    }
    return response.data;
  },

  linkPatient: async (payload: { code: string }): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/linking/connect`, payload, {
      headers: getXUserIdHeader(),
    });
  },

  unlinkPatient: async (): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/linking/disconnect/patient`, {}, {
      headers: getXUserIdHeader(),
    });
  },

  unlinkNutritionist: async (patientId: string): Promise<void> => {
    await httpClient.post(
      `${CLINICAL_API_URL}/linking/disconnect/nutritionist/${patientId}`,
      {},
      { headers: getXUserIdHeader() }
    );
  },

  isPatientLinked: async (): Promise<boolean> => {
    try {
      const profile = await clinicalApi.getMyProfile();
      return profile.nutritionistId != null && profile.nutritionistId !== '';
    } catch {
      return false;
    }
  },
};

export const createObservation = async (
  data: CreateObservationRequest
): Promise<ObservationResponse> => {
  const response = await httpClient.post<ObservationResponse>(
    `${CLINICAL_API_URL}/observations`,
    data,
    { headers: getXUserIdHeader() }
  );
  return response.data;
};

export const getPatientObservations = async (
  patientId: string
): Promise<ObservationResponse[]> => {
  const response = await httpClient.get<ObservationResponse[]>(
    `/clinical/observations/patient/${encodeURIComponent(patientId)}`,
    { headers: getXUserIdHeader() }
  );
  return response.data;
};
