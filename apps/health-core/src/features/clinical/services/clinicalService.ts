import type {
  CreateProfilePayload,
  HealthGoalResponse,
  WeightRecord,
  PatientProfileResponse,
  NutritionistPatientProfileResponse,
  NutritionistProfilePayload,
  NutritionistProfileResponse,
  ObservationResponse,
  PostalCodeLookupResponse,
  CreateObservationRequest,
  UpdateObservationRequest,
  NutritionPlanViewResponse,
  NutritionPlanUpsertRequest,
  CatalogFoodResponse,
  NutritionistWeightProgressReportResponse,
} from '../types/clinical.types';

import httpClient from '@/core/http/httpClient';

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
  clinicAddress: profile.clinicAddress
    ? {
        postalCode: profile.clinicAddress.postalCode ?? '',
        state: profile.clinicAddress.state ?? '',
        city: profile.clinicAddress.city ?? '',
        municipality: profile.clinicAddress.municipality ?? '',
        neighborhood: profile.clinicAddress.neighborhood ?? '',
        street: profile.clinicAddress.street ?? '',
        exteriorNumber: profile.clinicAddress.exteriorNumber ?? '',
        interiorNumber: profile.clinicAddress.interiorNumber ?? '',
      }
    : null,
  bio: profile.bio ?? '',
  profileCompleted: profile.profileCompleted ?? false,
});

export const clinicalApi = {
  createProfile: async (payload: CreateProfilePayload): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/profile`, payload);
  },

  updateMyProfile: async (payload: CreateProfilePayload): Promise<PatientProfileResponse> => {
    const response = await httpClient.put<PatientProfileResponse>(`${CLINICAL_API_URL}/profile/me`, payload);
    return normalizePatientProfile(response.data);
  },

  getMyProfile: async (): Promise<PatientProfileResponse> => {
    const response = await httpClient.get<PatientProfileResponse>(`${CLINICAL_API_URL}/profile/me`);
    return normalizePatientProfile(response.data);
  },

  getMyLinkedNutritionistProfile: async (): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.get<NutritionistProfileResponse>(`${CLINICAL_API_URL}/profile/me/nutritionist`);
    return normalizeNutritionistProfile(response.data);
  },

  createNutritionistProfile: async (payload: NutritionistProfilePayload): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/nutritionist/profile`, payload);
  },

  updateMyNutritionistProfile: async (
    payload: NutritionistProfilePayload
  ): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.put<NutritionistProfileResponse>(`${CLINICAL_API_URL}/nutritionist/profile/me`, payload);
    return normalizeNutritionistProfile(response.data);
  },

  getMyNutritionistProfile: async (): Promise<NutritionistProfileResponse> => {
    const response = await httpClient.get<NutritionistProfileResponse>(`${CLINICAL_API_URL}/nutritionist/profile/me`);
    return normalizeNutritionistProfile(response.data);
  },

  lookupPostalCode: async (postalCode: string): Promise<PostalCodeLookupResponse> => {
    const response = await httpClient.get<PostalCodeLookupResponse>(`${CLINICAL_API_URL}/reference/postal-codes/${encodeURIComponent(postalCode)}`);
    return response.data;
  },

  getNutritionistPatients: async (): Promise<NutritionistPatientProfileResponse[]> => {
    const response = await httpClient.get<NutritionistPatientProfileResponse[]>(`${CLINICAL_API_URL}/nutritionist/patients`);
    return response.data.map(normalizePatientProfile);
  },

  getNutritionistPatientProfile: async (
    patientId: string
  ): Promise<NutritionistPatientProfileResponse> => {
    const response = await httpClient.get<NutritionistPatientProfileResponse>(`${CLINICAL_API_URL}/nutritionist/patients/${encodeURIComponent(patientId)}`);
    return normalizePatientProfile(response.data);
  },

  getNutritionistWeightProgressReport: async (
    from: string,
    to: string
  ): Promise<NutritionistWeightProgressReportResponse> => {
    const response = await httpClient.get<NutritionistWeightProgressReportResponse>(
      `${CLINICAL_API_URL}/nutritionist/reports/weight-progress`,
      {
        params: { from, to },
      }
    );
    return response.data;
  },

  getMyGoals: async (): Promise<HealthGoalResponse> => {
    const response = await httpClient.get<HealthGoalResponse>(`${CLINICAL_API_URL}/goals/me`);
    return response.data;
  },

  updateWeight: async (weightKg: number, date: string): Promise<HealthGoalResponse> => {
    const response = await httpClient.post<HealthGoalResponse>(`${CLINICAL_API_URL}/weight`, { weightKg, date });
    return response.data;
  },

  editWeight: async (
    originalDate: string,
    weightKg: number,
    date: string
  ): Promise<HealthGoalResponse> => {
    const response = await httpClient.put<HealthGoalResponse>(`${CLINICAL_API_URL}/weight/${encodeURIComponent(originalDate)}`, { weightKg, date });
    return response.data;
  },

  deleteWeight: async (date: string): Promise<HealthGoalResponse> => {
    const response = await httpClient.delete<HealthGoalResponse>(`${CLINICAL_API_URL}/weight/${encodeURIComponent(date)}`);
    return response.data;
  },

  getWeightHistory: async (): Promise<WeightRecord[]> => {
    const response = await httpClient.get<WeightRecord[]>(`${CLINICAL_API_URL}/weight/history`);
    return response.data;
  },

  getNutritionistPatientWeightHistory: async (patientId: string): Promise<WeightRecord[]> => {
    const response = await httpClient.get<WeightRecord[]>(
      `${CLINICAL_API_URL}/nutritionist/patients/${encodeURIComponent(patientId)}/weight-history`
    );
    return response.data;
  },

  generateLinkingCode: async (): Promise<{ code: string; expiresInSeconds: number }> => {
    const response = await httpClient.post(`${CLINICAL_API_URL}/linking/generate`, {});
    return response.data;
  },

  getCurrentLinkingCode: async (): Promise<{ code: string; expiresInSeconds: number } | null> => {
    const response = await httpClient.get(`${CLINICAL_API_URL}/linking/current`);
    if (response.status === 204) {
      return null;
    }
    return response.data;
  },

  linkPatient: async (payload: { code: string }): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/linking/connect`, payload);
  },

  unlinkPatient: async (): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/linking/disconnect/patient`, {});
  },

  unlinkNutritionist: async (patientId: string): Promise<void> => {
    await httpClient.post(`${CLINICAL_API_URL}/linking/disconnect/nutritionist/${patientId}`, {});
  },

  isPatientLinked: async (): Promise<boolean> => {
    try {
      const profile = await clinicalApi.getMyProfile();
      return profile.nutritionistId != null && profile.nutritionistId !== '';
    } catch {
      return false;
    }
  },

  getMyNutritionPlan: async (): Promise<NutritionPlanViewResponse> => {
    const response = await httpClient.get<NutritionPlanViewResponse>(`${CLINICAL_API_URL}/nutrition-plan/me`);
    return response.data;
  },

  upsertMyNutritionPlan: async (
    payload: NutritionPlanUpsertRequest
  ): Promise<NutritionPlanViewResponse> => {
    const response = await httpClient.put<NutritionPlanViewResponse>(`${CLINICAL_API_URL}/nutrition-plan/me`, payload);
    return response.data;
  },

  getNutritionistPatientNutritionPlan: async (
    patientId: string
  ): Promise<NutritionPlanViewResponse> => {
    const response = await httpClient.get<NutritionPlanViewResponse>(`${CLINICAL_API_URL}/nutritionist/patients/${encodeURIComponent(patientId)}/nutrition-plan`);
    return response.data;
  },

  upsertNutritionistPatientNutritionPlan: async (
    patientId: string,
    payload: NutritionPlanUpsertRequest
  ): Promise<NutritionPlanViewResponse> => {
    const response = await httpClient.put<NutritionPlanViewResponse>(`${CLINICAL_API_URL}/nutritionist/patients/${encodeURIComponent(patientId)}/nutrition-plan`, payload);
    return response.data;
  },

  searchCatalogFoods: async (query: string): Promise<CatalogFoodResponse[]> => {
    const response = await httpClient.get<CatalogFoodResponse[]>(
      `${CLINICAL_API_URL}/catalog/foods/search`,
      {
        params: { query },
      }
    );
    return response.data;
  },

  getMyObservations: async (): Promise<ObservationResponse[]> => {
    const response = await httpClient.get<ObservationResponse[]>(`${CLINICAL_API_URL}/observations/me`);
    return response.data;
  },
};

export const createObservation = async (
  data: CreateObservationRequest
): Promise<ObservationResponse> => {
  const response = await httpClient.post<ObservationResponse>(`${CLINICAL_API_URL}/observations`, data);
  return response.data;
};

export const getPatientObservations = async (
  patientId: string
): Promise<ObservationResponse[]> => {
  const response = await httpClient.get<ObservationResponse[]>(`/clinical/observations/patient/${encodeURIComponent(patientId)}`);
  return response.data;
};

export const updateObservation = async (
  observationId: string,
  data: UpdateObservationRequest
): Promise<ObservationResponse> => {
  const response = await httpClient.put<ObservationResponse>(
    `${CLINICAL_API_URL}/observations/${encodeURIComponent(observationId)}`,
    data
  );
  return response.data;
};

export const deleteObservation = async (observationId: string): Promise<void> => {
  await httpClient.delete(`${CLINICAL_API_URL}/observations/${encodeURIComponent(observationId)}`);
};
