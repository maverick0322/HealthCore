import type {
  ClinicAddressPayload,
  ConsultationType,
  NutritionistSpecialization,
} from '@/features/clinical/types/clinical.types';

export interface IdentityState {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

export interface ProfessionalState {
  specializations: NutritionistSpecialization[];
  customSpecialization: string;
  professionalLicense: string;
}

export interface ContactState {
  phone: string;
  clinicAddress: ClinicAddressPayload;
}

export interface PostalLookupState {
  postalCode: string;
  colonies: string[];
}

export interface NutritionistStep1IdentityProps {
  mode: 'create' | 'edit';
  identity: IdentityState;
  errors: Record<string, string | null>;
  onChange: (patch: Partial<IdentityState>) => void;
  onNext: () => void;
  onBackToProfile: () => void;
}

export interface NutritionistStep2ProfessionalProps {
  professional: ProfessionalState;
  errors: Record<string, string | null>;
  onBack: () => void;
  onNext: () => void;
  onToggleSpecialization: (value: NutritionistSpecialization) => void;
  onChange: (patch: Partial<ProfessionalState>) => void;
}

export interface NutritionistStep3ConsultationProps {
  consultationTypes: ConsultationType[];
  error?: string | null;
  onBack: () => void;
  onNext: () => void;
  onToggleConsultationType: (value: ConsultationType) => void;
}

export interface NutritionistStep4ContactProps {
  contact: ContactState;
  errors: Record<string, string | null>;
  postalLookup: PostalLookupState | null;
  isPostalLookupLoading: boolean;
  postalLookupMessage: string | null;
  isCatalogPostalCode: boolean;
  onBack: () => void;
  onNext: () => void;
  onPhoneChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onClinicAddressChange: (patch: Partial<ClinicAddressPayload>) => void;
}

export interface NutritionistStep5SummaryProps {
  mode: 'create' | 'edit';
  identity: IdentityState;
  professional: ProfessionalState;
  consultationTypes: ConsultationType[];
  contact: ContactState;
  bio: string;
  errors: Record<string, string | null>;
  submitError: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onBioChange: (value: string) => void;
}
