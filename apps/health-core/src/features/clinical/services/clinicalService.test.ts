import { beforeEach, describe, expect, it, vi } from 'vitest';

import httpClient from '@/core/http/httpClient';

import {
  clinicalApi,
  createObservation,
  getPatientObservations,
} from './clinicalService';
import type {
  CreateProfilePayload,
  NutritionistProfilePayload,
  NutritionPlanUpsertRequest,
} from '../types/clinical.types';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('clinicalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates, updates and fetches the patient profile without custom user headers', async () => {
    const payload: CreateProfilePayload = {
      firstName: 'Carlos',
      paternalLastName: 'Gomez',
      maternalLastName: '',
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
      goal: 'weight-loss',
      dietType: 'omnivore',
      allergies: [],
      excludedFoods: [],
    };

    (httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { userId: 'user-123', profileCompleted: true, ...payload },
    });
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        userId: 'user-123',
        fullName: 'Carlos Gomez',
        profileCompleted: true,
        nutritionistId: null,
        ...payload,
      },
    });

    await clinicalApi.createProfile(payload);
    const updated = await clinicalApi.updateMyProfile(payload);
    const fetched = await clinicalApi.getMyProfile();

    expect(httpClient.post).toHaveBeenCalledWith('/clinical/profile', payload);
    expect(httpClient.put).toHaveBeenCalledWith('/clinical/profile/me', payload);
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/profile/me');
    expect(updated.profileCompleted).toBe(true);
    expect(fetched.fullName).toBe('Carlos Gomez');
  });

  it('handles nutritionist profile and postal code lookup', async () => {
    const payload: NutritionistProfilePayload = {
      firstName: 'Daniel',
      paternalLastName: 'Martinez',
      maternalLastName: '',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['ONLINE'],
      phone: '5512345678',
      clinicAddress: {
        postalCode: '03100',
        state: 'Ciudad de Mexico',
        city: 'Ciudad de Mexico',
        municipality: 'Benito Juarez',
        neighborhood: 'Narvarte Oriente',
        street: 'Xola',
        exteriorNumber: '123',
        interiorNumber: '',
      },
      bio: 'Especialista en nutricion clinica',
    };

    (httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { userId: 'nutri-1', fullName: 'Daniel Martinez', profileCompleted: true, ...payload },
    });
    (httpClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: { userId: 'nutri-1', fullName: 'Daniel Martinez', profileCompleted: true, ...payload },
      })
      .mockResolvedValueOnce({
        data: {
          postalCode: '03100',
          state: 'Ciudad de Mexico',
          city: 'Ciudad de Mexico',
          municipality: 'Benito Juarez',
          colonies: ['Narvarte Oriente'],
        },
      });

    await clinicalApi.createNutritionistProfile(payload);
    const updated = await clinicalApi.updateMyNutritionistProfile(payload);
    const profile = await clinicalApi.getMyNutritionistProfile();
    const postalLookup = await clinicalApi.lookupPostalCode('03100');

    expect(httpClient.post).toHaveBeenCalledWith('/clinical/nutritionist/profile', payload);
    expect(httpClient.put).toHaveBeenCalledWith('/clinical/nutritionist/profile/me', payload);
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/nutritionist/profile/me');
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/reference/postal-codes/03100');
    expect(updated.fullName).toBe('Daniel Martinez');
    expect(profile.clinicAddress?.municipality).toBe('Benito Juarez');
    expect(postalLookup.colonies).toContain('Narvarte Oriente');
  });

  it('handles nutritionist reports and patient weight endpoints', async () => {
    (httpClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: {
          activePatients: 2,
          patientsWithoutWeightInRange: 1,
          rows: [],
        },
      })
      .mockResolvedValueOnce({ data: [{ weightKg: 80, date: '2024-01-01' }] });
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { targetCalories: 2500, targetProtein: 150, targetCarbs: 250, targetFat: 70 },
    });
    (httpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { targetCalories: 2400, targetProtein: 145, targetCarbs: 240, targetFat: 68 },
    });
    (httpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { targetCalories: 2300, targetProtein: 140, targetCarbs: 230, targetFat: 65 },
    });

    const report = await clinicalApi.getNutritionistWeightProgressReport('2026-05-01', '2026-05-22');
    const goalResult = await clinicalApi.updateWeight(75.5, '2026-05-20');
    const editedGoalResult = await clinicalApi.editWeight('2026-05-20', 74.8, '2026-05-18');
    const deletedGoalResult = await clinicalApi.deleteWeight('2026-05-18');
    const history = await clinicalApi.getWeightHistory();

    expect(httpClient.get).toHaveBeenCalledWith('/clinical/nutritionist/reports/weight-progress', {
      params: { from: '2026-05-01', to: '2026-05-22' },
    });
    expect(httpClient.post).toHaveBeenCalledWith('/clinical/weight', { weightKg: 75.5, date: '2026-05-20' });
    expect(httpClient.put).toHaveBeenCalledWith('/clinical/weight/2026-05-20', { weightKg: 74.8, date: '2026-05-18' });
    expect(httpClient.delete).toHaveBeenCalledWith('/clinical/weight/2026-05-18');
    expect(report.activePatients).toBe(2);
    expect(goalResult.targetCalories).toBe(2500);
    expect(editedGoalResult.targetCalories).toBe(2400);
    expect(deletedGoalResult.targetCalories).toBe(2300);
    expect(history).toHaveLength(1);
  });

  it('handles linking, plans, catalog search and observations without X-User-Id', async () => {
    const payload: NutritionPlanUpsertRequest = {
      sections: [
        { mealSlot: 'BREAKFAST', options: [] },
        { mealSlot: 'LUNCH', options: [] },
        { mealSlot: 'DINNER', options: [] },
        { mealSlot: 'SNACK', options: [] },
      ],
    };

    const mockPlanResponse = {
      data: {
        mode: 'SELF_MANAGED',
        authorType: 'SELF_MANAGED',
        canEdit: true,
        dailyGoals: {
          targetCalories: 2000,
          targetProtein: 120,
          targetCarbs: 200,
          targetFat: 60,
          targetWaterGlasses: 10,
        },
        sections: [],
        contextSelfManagedPlan: null,
      },
    };

    (httpClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { code: 'XYZ123', expiresInSeconds: 450 }, status: 200 })
      .mockResolvedValueOnce({ data: null, status: 204 })
      .mockResolvedValueOnce(mockPlanResponse)
      .mockResolvedValueOnce(mockPlanResponse)
      .mockResolvedValueOnce({ data: [{ barcode: 'food-1', name: 'Avena' }] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'obs-1',
            patientId: 'patient-1',
            nutritionistId: 'nutri-1',
            note: 'Ajustar hidratacion',
            createdAt: '2026-05-18T12:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'obs-1' } });
    (httpClient.put as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockPlanResponse)
      .mockResolvedValueOnce(mockPlanResponse);

    const currentCode = await clinicalApi.getCurrentLinkingCode();
    const noCode = await clinicalApi.getCurrentLinkingCode();
    const myPlan = await clinicalApi.getMyNutritionPlan();
    const savedMyPlan = await clinicalApi.upsertMyNutritionPlan(payload);
    const nutritionistPlan = await clinicalApi.getNutritionistPatientNutritionPlan('patient-1');
    const savedNutritionistPlan = await clinicalApi.upsertNutritionistPatientNutritionPlan('patient-1', payload);
    const foods = await clinicalApi.searchCatalogFoods('avena');
    const myObservations = await clinicalApi.getMyObservations();

    await clinicalApi.linkPatient({ code: 'ABC123' });
    await clinicalApi.unlinkPatient();
    await clinicalApi.unlinkNutritionist('patient-1');
    await createObservation({ patientId: 'patient-1', note: 'Nota clinica' });
    const patientObservations = await getPatientObservations('patient-1');

    expect(currentCode?.code).toBe('XYZ123');
    expect(noCode).toBeNull();
    expect(myPlan.dailyGoals.targetWaterGlasses).toBe(10);
    expect(savedMyPlan.canEdit).toBe(true);
    expect(nutritionistPlan.mode).toBe('SELF_MANAGED');
    expect(savedNutritionistPlan.authorType).toBe('SELF_MANAGED');
    expect(foods[0].barcode).toBe('food-1');
    expect(myObservations[0].note).toBe('Ajustar hidratacion');
    expect(patientObservations).toEqual([]);
    expect(httpClient.post).toHaveBeenCalledWith('/clinical/linking/connect', { code: 'ABC123' });
    expect(httpClient.post).toHaveBeenCalledWith('/clinical/linking/disconnect/patient', {});
    expect(httpClient.post).toHaveBeenCalledWith('/clinical/linking/disconnect/nutritionist/patient-1', {});
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/catalog/foods/search', {
      params: { query: 'avena' },
    });
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/observations/me');
    expect(httpClient.get).toHaveBeenCalledWith('/clinical/observations/patient/patient-1');
  });
});
