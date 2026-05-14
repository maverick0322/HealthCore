import { create } from 'zustand';

import type {
  ActivityLevel,
  Allergy,
  CreateProfilePayload,
  DietType,
  Gender,
  PatientGoal,
} from '@/features/clinical/types/clinical.types';

interface PatientIdentityData {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

interface PatientPhysicalData {
  birthDate: string;
  heightCm: number;
  weightKg: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

interface PatientPreferences {
  dietType: DietType;
  allergies: Allergy[];
  excludedFoods: string[];
}

interface PatientOnboardingState {
  step: number;
  identity: PatientIdentityData;
  physical: PatientPhysicalData;
  goal: PatientGoal;
  preferences: PatientPreferences;
  hasExistingProfile: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIdentityData: (data: Partial<PatientIdentityData>) => void;
  setPhysicalData: (data: Partial<PatientPhysicalData>) => void;
  setGoal: (goal: PatientGoal) => void;
  setPreferences: (data: Partial<PatientPreferences>) => void;
  toggleAllergy: (allergy: Allergy) => void;
  addExcludedFood: (food: string) => void;
  removeExcludedFood: (food: string) => void;
  hydrateFromProfile: (profile: CreateProfilePayload, hasExistingProfile: boolean) => void;
  setHasExistingProfile: (hasExistingProfile: boolean) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  identity: {
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
  },
  physical: {
    birthDate: '',
    heightCm: 175,
    weightKg: 72.5,
    gender: 'MALE' as Gender,
    activityLevel: 'SEDENTARY' as ActivityLevel,
  },
  goal: 'weight-loss' as PatientGoal,
  preferences: {
    dietType: 'omnivore' as DietType,
    allergies: [] as Allergy[],
    excludedFoods: [],
  },
  hasExistingProfile: false,
};

export const usePatientOnboardingStore = create<PatientOnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  setIdentityData: (data) =>
    set((state) => ({ identity: { ...state.identity, ...data } })),

  setPhysicalData: (data) =>
    set((state) => ({ physical: { ...state.physical, ...data } })),

  setGoal: (goal) => set({ goal }),

  setPreferences: (data) =>
    set((state) => ({ preferences: { ...state.preferences, ...data } })),

  toggleAllergy: (allergy) =>
    set((state) => {
      const exists = state.preferences.allergies.includes(allergy);
      const allergies = exists
        ? state.preferences.allergies.filter((item) => item !== allergy)
        : [...state.preferences.allergies, allergy];

      return { preferences: { ...state.preferences, allergies } };
    }),

  addExcludedFood: (food) =>
    set((state) => {
      const normalized = food.trim();
      if (!normalized || state.preferences.excludedFoods.includes(normalized)) {
        return state;
      }

      return {
        preferences: {
          ...state.preferences,
          excludedFoods: [...state.preferences.excludedFoods, normalized],
        },
      };
    }),

  removeExcludedFood: (food) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        excludedFoods: state.preferences.excludedFoods.filter((item) => item !== food),
      },
    })),

  hydrateFromProfile: (profile, hasExistingProfile) =>
    set({
      step: 1,
      identity: {
        firstName: profile.firstName,
        paternalLastName: profile.paternalLastName,
        maternalLastName: profile.maternalLastName ?? '',
      },
      physical: {
        birthDate: profile.birthDate,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        gender: profile.gender,
        activityLevel: profile.activityLevel,
      },
      goal: profile.goal,
      preferences: {
        dietType: profile.dietType,
        allergies: profile.allergies,
        excludedFoods: profile.excludedFoods,
      },
      hasExistingProfile,
    }),

  setHasExistingProfile: (hasExistingProfile) => set({ hasExistingProfile }),

  reset: () => set(initialState),
}));
