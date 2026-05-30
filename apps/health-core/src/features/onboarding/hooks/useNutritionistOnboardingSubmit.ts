import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistProfilePayload } from '@/features/clinical/types/clinical.types';

interface UseNutritionistOnboardingSubmitOptions {
  mode: 'create' | 'edit';
  hasExistingProfile: boolean;
}

export const useNutritionistOnboardingSubmit = ({
  mode,
  hasExistingProfile,
}: UseNutritionistOnboardingSubmitOptions) => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (payload: NutritionistProfilePayload) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (hasExistingProfile) {
        await clinicalApi.updateMyNutritionistProfile(payload);
      } else {
        await clinicalApi.createNutritionistProfile(payload);
      }

      navigate(mode === 'edit' ? '/profile/nutritionist' : '/dashboard/nutritionist', {
        replace: true,
      });
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('nutritionist.common.saveError');
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitError,
    handleSubmit,
  };
};
