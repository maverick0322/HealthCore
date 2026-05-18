import { create } from 'zustand';

import type {
  ClinicAddressPayload,
  ConsultationType,
  NutritionistProfilePayload,
  NutritionistSpecialization,
} from '@/features/clinical/types/clinical.types';

interface NutritionistIdentityData {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

interface NutritionistProfessionalData {
  specializations: NutritionistSpecialization[];
  customSpecialization: string;
  professionalLicense: string;
}

interface NutritionistContactData {
  phone: string;
  clinicAddress: ClinicAddressPayload;
}

interface NutritionistOnboardingState {
  step: number;
  identity: NutritionistIdentityData;
  professional: NutritionistProfessionalData;
  consultationTypes: ConsultationType[];
  contact: NutritionistContactData;
  bio: string;
  hasExistingProfile: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIdentityData: (data: Partial<NutritionistIdentityData>) => void;
  setProfessionalData: (data: Partial<NutritionistProfessionalData>) => void;
  toggleSpecialization: (specialization: NutritionistSpecialization) => void;
  setConsultationTypes: (consultationTypes: ConsultationType[]) => void;
  toggleConsultationType: (consultationType: ConsultationType) => void;
  setContactData: (data: Partial<NutritionistContactData>) => void;
  setClinicAddress: (data: Partial<ClinicAddressPayload>) => void;
  setBio: (bio: string) => void;
  hydrateFromProfile: (profile: NutritionistProfilePayload, hasExistingProfile: boolean) => void;
  setHasExistingProfile: (hasExistingProfile: boolean) => void;
  reset: () => void;
}

const initialClinicAddress: ClinicAddressPayload = {
  postalCode: '',
  state: '',
  city: '',
  municipality: '',
  neighborhood: '',
  street: '',
  exteriorNumber: '',
  interiorNumber: '',
};

const initialState = {
  step: 1,
  identity: {
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
  },
  professional: {
    specializations: [] as NutritionistSpecialization[],
    customSpecialization: '',
    professionalLicense: '',
  },
  consultationTypes: [] as ConsultationType[],
  contact: {
    phone: '',
    clinicAddress: initialClinicAddress,
  },
  bio: '',
  hasExistingProfile: false,
};

export const useNutritionistOnboardingStore = create<NutritionistOnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  setIdentityData: (data) =>
    set((state) => ({ identity: { ...state.identity, ...data } })),

  setProfessionalData: (data) =>
    set((state) => ({ professional: { ...state.professional, ...data } })),

  toggleSpecialization: (specialization) =>
    set((state) => {
      const exists = state.professional.specializations.includes(specialization);
      const specializations = exists
        ? state.professional.specializations.filter((item) => item !== specialization)
        : [...state.professional.specializations, specialization];

      return {
        professional: {
          ...state.professional,
          specializations: specializations.slice(0, 3),
        },
      };
    }),

  setConsultationTypes: (consultationTypes) => set({ consultationTypes }),

  toggleConsultationType: (consultationType) =>
    set((state) => {
      const exists = state.consultationTypes.includes(consultationType);
      return {
        consultationTypes: exists
          ? state.consultationTypes.filter((item) => item !== consultationType)
          : [...state.consultationTypes, consultationType],
      };
    }),

  setContactData: (data) =>
    set((state) => ({ contact: { ...state.contact, ...data } })),

  setClinicAddress: (data) =>
    set((state) => ({
      contact: {
        ...state.contact,
        clinicAddress: { ...state.contact.clinicAddress, ...data },
      },
    })),

  setBio: (bio) => set({ bio }),

  hydrateFromProfile: (profile, hasExistingProfile) =>
    set({
      step: 1,
      identity: {
        firstName: profile.firstName,
        paternalLastName: profile.paternalLastName,
        maternalLastName: profile.maternalLastName ?? '',
      },
      professional: {
        specializations: profile.specializations,
        customSpecialization: profile.customSpecialization ?? '',
        professionalLicense: profile.professionalLicense,
      },
      consultationTypes: profile.consultationTypes,
      contact: {
        phone: profile.phone ?? '',
        clinicAddress: profile.clinicAddress
          ? { ...initialClinicAddress, ...profile.clinicAddress }
          : initialClinicAddress,
      },
      bio: profile.bio,
      hasExistingProfile,
    }),

  setHasExistingProfile: (hasExistingProfile) => set({ hasExistingProfile }),

  reset: () => set(initialState),
}));
