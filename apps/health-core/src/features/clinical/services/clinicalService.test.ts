import { beforeEach, describe, expect, it, vi } from 'vitest';

import httpClient from '@/core/http/httpClient';
import { extractUserIdFromToken } from '@/core/utils/jwt';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

import {
  clinicalApi,
  createObservation,
  getPatientObservations,
} from './clinicalService';
import type {
  CreateProfilePayload,
  NutritionistProfilePayload,
} from '../types/clinical.types';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/features/auth/store/useAuthStore');
vi.mock('@/core/utils/jwt');

const MOCK_USER_ID = 'user-123';

describe('clinicalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      accessToken: 'mock-token',
    });
    (extractUserIdFromToken as unknown as ReturnType<typeof vi.fn>).mockReturnValue(MOCK_USER_ID);
  });

  it('should create a patient profile', async () => {
    const payload: CreateProfilePayload = {
      firstName: 'Carlos',
      paternalLastName: 'Gomez',
      maternalLastName: '',
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
      goal: 'weight-loss' as const,
      dietType: 'omnivore' as const,
      allergies: [],
      excludedFoods: [],
    };

    await clinicalApi.createProfile(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/clinical/profile', payload, {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });
  });

  it('should update the current patient profile', async () => {
    const payload: CreateProfilePayload = {
      firstName: 'Carlos',
      paternalLastName: 'Gomez',
      maternalLastName: '',
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
      goal: 'health' as const,
      dietType: 'vegan' as const,
      allergies: ['gluten'],
      excludedFoods: ['cebolla'],
    };

    const mockResponse = { data: { userId: MOCK_USER_ID, profileCompleted: true, ...payload } };
    (httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await clinicalApi.updateMyProfile(payload);

    expect(httpClient.put).toHaveBeenCalledWith('/clinical/profile/me', payload, {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });
    expect(result).toEqual({
      ...mockResponse.data,
      fullName: null,
      nutritionistId: null,
    });
  });

  it('should fetch the current patient profile', async () => {
    const mockResponse = {
      data: {
        userId: MOCK_USER_ID,
        firstName: 'Carlos',
        paternalLastName: 'Gomez',
        maternalLastName: '',
        fullName: 'Carlos Gomez',
        weightKg: 75.5,
        heightCm: 180,
        birthDate: '1995-01-01',
        gender: 'MALE',
        activityLevel: 'MODERATELY_ACTIVE',
        goal: 'weight-loss',
        dietType: 'omnivore',
        allergies: [],
        excludedFoods: [],
        nutritionistId: null,
        profileCompleted: true,
      },
    };
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await clinicalApi.getMyProfile();

    expect(httpClient.get).toHaveBeenCalledWith('/clinical/profile/me', {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should create and fetch the nutritionist profile', async () => {
    const payload: NutritionistProfilePayload = {
      firstName: 'Daniel',
      paternalLastName: 'Martinez',
      maternalLastName: '',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['PRESENTIAL', 'ONLINE'],
      phone: '5512345678',
      clinicAddress: {
        postalCode: '03100',
        state: 'CDMX',
        city: 'Benito Juarez',
        neighborhood: 'Narvarte',
        street: 'Xola',
        exteriorNumber: '123',
        interiorNumber: '',
      },
      bio: 'Especialista en nutricion clinica.',
    };

    await clinicalApi.createNutritionistProfile(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/clinical/nutritionist/profile', payload, {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });

    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { userId: MOCK_USER_ID, fullName: 'Daniel Martinez', profileCompleted: true, ...payload },
    });

    const result = await clinicalApi.getMyNutritionistProfile();
    expect(result.fullName).toBe('Daniel Martinez');
  });

  it('should fetch nutritionist patients and one patient detail', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: [
          {
            userId: 'patient-one@example.com',
            firstName: 'Carlos',
            paternalLastName: 'Gomez',
            maternalLastName: '',
            fullName: 'Carlos Gomez',
            weightKg: 70,
            heightCm: 175,
            birthDate: '1990-01-01',
            gender: 'MALE',
            activityLevel: 'MODERATELY_ACTIVE',
            goal: 'weight-loss',
            dietType: 'omnivore',
            allergies: [],
            excludedFoods: [],
            nutritionistId: MOCK_USER_ID,
            profileCompleted: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          userId: 'patient-one@example.com',
          firstName: 'Carlos',
          paternalLastName: 'Gomez',
          maternalLastName: '',
          fullName: 'Carlos Gomez',
          weightKg: 70,
          heightCm: 175,
          birthDate: '1990-01-01',
          gender: 'MALE',
          activityLevel: 'MODERATELY_ACTIVE',
          goal: 'weight-loss',
          dietType: 'omnivore',
          allergies: [],
          excludedFoods: [],
          nutritionistId: MOCK_USER_ID,
          profileCompleted: true,
        },
      });

    const patients = await clinicalApi.getNutritionistPatients();
    const patient = await clinicalApi.getNutritionistPatientProfile('patient-one@example.com');

    expect(patients[0].fullName).toBe('Carlos Gomez');
    expect(patient.userId).toBe('patient-one@example.com');
  });

  it('should handle weight endpoints and linking helpers', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { targetCalories: 2500, targetProtein: 150, targetCarbs: 250, targetFat: 70 },
    });

    const goalResult = await clinicalApi.updateWeight(75.5);
    expect(goalResult.targetCalories).toBe(2500);

    (httpClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ weightKg: 80, date: '2024-01-01' }] })
      .mockResolvedValueOnce({ data: { code: 'XYZ123', expiresInSeconds: 450 }, status: 200 })
      .mockResolvedValueOnce({ data: null, status: 204 });

    const history = await clinicalApi.getWeightHistory();
    const currentCode = await clinicalApi.getCurrentLinkingCode();
    const noCode = await clinicalApi.getCurrentLinkingCode();

    expect(history).toHaveLength(1);
    expect(currentCode?.code).toBe('XYZ123');
    expect(noCode).toBeNull();
  });

  it('should send linking and observation requests with auth headers', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'obs-1' } });
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await clinicalApi.linkPatient({ code: 'ABC123' });
    await clinicalApi.unlinkPatient();
    await clinicalApi.unlinkNutritionist('patient-1');
    await createObservation({ patientId: 'patient-1', note: 'Nota clinica' });
    await getPatientObservations('patient-1');

    expect(httpClient.post).toHaveBeenCalledWith('/clinical/linking/connect', { code: 'ABC123' }, {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/observations/patient/patient-1', {
      headers: { 'X-User-Id': MOCK_USER_ID },
    });
  });
});
