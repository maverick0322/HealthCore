import type { TFunction } from 'i18next';

import type {
  ClinicAddressPayload,
  ConsultationType,
  NutritionistProfilePayload,
  NutritionistSpecialization,
  PostalCodeLookupResponse,
} from '@/features/clinical/types/clinical.types';
import { normalizeText, validateOptionalName, validateRequiredName } from '@/features/onboarding/utils/profileValidation';

export interface NutritionistIdentityData {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

export interface NutritionistProfessionalData {
  specializations: NutritionistSpecialization[];
  customSpecialization: string;
  professionalLicense: string;
}

export interface NutritionistContactData {
  phone: string;
  clinicAddress: ClinicAddressPayload;
}

export interface NutritionistOnboardingData {
  identity: NutritionistIdentityData;
  professional: NutritionistProfessionalData;
  consultationTypes: ConsultationType[];
  contact: NutritionistContactData;
  bio: string;
}

export const hasAnyAddressValue = (address: ClinicAddressPayload): boolean =>
  Object.values(address).some((value) => Boolean(value?.trim()));

export const sanitizeAddress = (address: ClinicAddressPayload): ClinicAddressPayload => ({
  postalCode: address.postalCode.trim(),
  state: normalizeText(address.state),
  city: normalizeText(address.city),
  municipality: normalizeText(address.municipality),
  neighborhood: normalizeText(address.neighborhood),
  street: normalizeText(address.street),
  exteriorNumber: normalizeText(address.exteriorNumber),
  interiorNumber: address.interiorNumber?.trim() ? normalizeText(address.interiorNumber) : '',
});

export const buildNutritionistProfilePayload = (
  data: NutritionistOnboardingData,
): NutritionistProfilePayload => ({
  firstName: data.identity.firstName.trim(),
  paternalLastName: data.identity.paternalLastName.trim(),
  maternalLastName: data.identity.maternalLastName.trim(),
  specializations: data.professional.specializations,
  customSpecialization: data.professional.customSpecialization.trim(),
  professionalLicense: data.professional.professionalLicense.trim(),
  consultationTypes: data.consultationTypes,
  phone: data.contact.phone.trim(),
  clinicAddress: hasAnyAddressValue(data.contact.clinicAddress)
    ? sanitizeAddress(data.contact.clinicAddress)
    : null,
  bio: data.bio.trim(),
});

export const formatManualAddress = (address: ClinicAddressPayload): string | undefined => {
  const parts = [
    address.street?.trim(),
    address.exteriorNumber?.trim(),
    address.interiorNumber?.trim() ? `Int. ${address.interiorNumber.trim()}` : null,
    address.neighborhood?.trim(),
    address.municipality?.trim(),
    address.city?.trim() && address.city?.trim() !== address.municipality?.trim() ? address.city.trim() : null,
    address.state?.trim(),
    address.postalCode?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
};

export const getNutritionistOnboardingStepErrors = (
  t: TFunction,
  step: number,
  data: NutritionistOnboardingData,
  postalLookup: PostalCodeLookupResponse | null,
): Record<string, string | null> => {
  if (step === 1) {
    return {
      firstName: validateRequiredName(data.identity.firstName, t('nutritionist.identity.fields.firstName'), t),
      paternalLastName: validateRequiredName(
        data.identity.paternalLastName,
        t('nutritionist.identity.fields.paternalLastName'),
        t,
      ),
      maternalLastName: validateOptionalName(
        data.identity.maternalLastName,
        t('nutritionist.identity.fields.maternalLastName'),
        t,
      ),
    };
  }

  if (step === 2) {
    return {
      specializations:
        data.professional.specializations.length === 0
          ? t('nutritionist.validation.specializationsRequired')
          : data.professional.specializations.length > 3
            ? t('nutritionist.validation.specializationsMax')
            : null,
      customSpecialization:
        data.professional.specializations.includes('OTHER') && !data.professional.customSpecialization.trim()
          ? t('nutritionist.validation.customSpecializationRequired')
          : null,
      professionalLicense: /^\d{7,10}$/.test(data.professional.professionalLicense.trim())
        ? null
        : t('nutritionist.validation.professionalLicense'),
    };
  }

  if (step === 3) {
    return {
      consultationTypes:
        data.consultationTypes.length === 0 ? t('nutritionist.validation.consultationTypesRequired') : null,
    };
  }

  if (step === 4) {
    const address = data.contact.clinicAddress;
    const hasAddress = hasAnyAddressValue(address);
    const requiresCatalogNeighborhood =
      postalLookup?.postalCode === address.postalCode.trim() && postalLookup.colonies.length > 0;

    return {
      phone:
        data.contact.phone.trim() && !/^\d{10}$/.test(data.contact.phone.trim())
          ? t('nutritionist.validation.phone')
          : null,
      postalCode:
        hasAddress && !/^\d{5}$/.test(address.postalCode.trim()) ? t('nutritionist.validation.postalCode') : null,
      state: hasAddress && !address.state.trim() ? t('nutritionist.validation.state') : null,
      city: hasAddress && !address.city.trim() ? t('nutritionist.validation.city') : null,
      municipality: hasAddress && !address.municipality.trim() ? t('nutritionist.validation.municipality') : null,
      neighborhood:
        hasAddress && !address.neighborhood.trim()
          ? t('nutritionist.validation.neighborhood')
          : requiresCatalogNeighborhood && !postalLookup.colonies.includes(address.neighborhood.trim())
            ? t('nutritionist.validation.neighborhoodSelection')
            : null,
      street: hasAddress && !address.street.trim() ? t('nutritionist.validation.street') : null,
      exteriorNumber: hasAddress && !address.exteriorNumber.trim() ? t('nutritionist.validation.exteriorNumber') : null,
      interiorNumber: null,
    };
  }

  return {
    bio: data.bio.trim() ? null : t('nutritionist.validation.bio'),
  };
};
