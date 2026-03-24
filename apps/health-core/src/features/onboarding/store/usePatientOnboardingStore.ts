import { create } from 'zustand';

export type GoalType = 'weight-loss' | 'muscle-gain' | 'health' | 'performance';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';

interface PhysicalData {
  age: number;
  height: number;
  weight: number;
}

interface Preferences {
  dietType: DietType;
  allergies: string[];
  excludedFoods: string[];
}

interface PatientOnboardingState {
  step: number;
  physical: PhysicalData;
  goal: GoalType;
  preferences: Preferences;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setPhysicalData: (data: Partial<PhysicalData>) => void;
  setGoal: (goal: GoalType) => void;
  setPreferences: (data: Partial<Preferences>) => void;
  toggleAllergy: (allergy: string) => void;
  addExcludedFood: (food: string) => void;
  removeExcludedFood: (food: string) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  physical: {
    age: 25,
    height: 175,
    weight: 72.5,
  },
  goal: 'weight-loss' as GoalType,
  preferences: {
    dietType: 'omnivore' as DietType,
    allergies: [],
    excludedFoods: [],
  },
};

export const usePatientOnboardingStore = create<PatientOnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  setPhysicalData: (data) =>
    set((state) => ({ physical: { ...state.physical, ...data } })),

  setGoal: (goal) => set({ goal }),

  setPreferences: (data) =>
    set((state) => ({ preferences: { ...state.preferences, ...data } })),

  toggleAllergy: (allergy) =>
    set((state) => {
      const exists = state.preferences.allergies.includes(allergy);
      const allergies = exists
        ? state.preferences.allergies.filter((a) => a !== allergy)
        : [...state.preferences.allergies, allergy];
      return { preferences: { ...state.preferences, allergies } };
    }),

  addExcludedFood: (food) =>
    set((state) => {
      if (state.preferences.excludedFoods.includes(food)) return state;
      return {
        preferences: {
          ...state.preferences,
          excludedFoods: [...state.preferences.excludedFoods, food],
        },
      };
    }),

  removeExcludedFood: (food) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        excludedFoods: state.preferences.excludedFoods.filter((f) => f !== food),
      },
    })),

  reset: () => set(initialState),
}));
