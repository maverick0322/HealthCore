import { useEffect, useState } from 'react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistProfilePayload } from '@/features/clinical/types/clinical.types';

interface UseNutritionistOnboardingBootstrapOptions {
  hydrateFromProfile: (payload: NutritionistProfilePayload, hasExistingProfile: boolean) => void;
  setHasExistingProfile: (hasExistingProfile: boolean) => void;
  reset: () => void;
}

export const useNutritionistOnboardingBootstrap = ({
  hydrateFromProfile,
  setHasExistingProfile,
  reset,
}: UseNutritionistOnboardingBootstrapOptions) => {
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await clinicalApi.getMyNutritionistProfile();
        const payload: NutritionistProfilePayload = {
          firstName: profile.firstName,
          paternalLastName: profile.paternalLastName,
          maternalLastName: profile.maternalLastName ?? '',
          specializations: profile.specializations,
          customSpecialization: profile.customSpecialization ?? '',
          professionalLicense: profile.professionalLicense,
          consultationTypes: profile.consultationTypes,
          phone: profile.phone ?? '',
          clinicAddress: profile.clinicAddress ?? null,
          bio: profile.bio,
        };
        hydrateFromProfile(payload, true);
      } catch {
        setHasExistingProfile(false);
        reset();
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [hydrateFromProfile, reset, setHasExistingProfile]);

  return {
    isLoadingProfile,
  };
};
