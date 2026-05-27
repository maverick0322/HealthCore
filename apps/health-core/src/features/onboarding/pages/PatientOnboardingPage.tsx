import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { CreateProfilePayload } from '@/features/clinical/types/clinical.types';
import { Step1Identity } from '@/features/onboarding/components/Step1Identity';
import { Step2PhysicalData } from '@/features/onboarding/components/Step2PhysicalData';
import { Step3Goals } from '@/features/onboarding/components/Step2Goals';
import { Step4Preferences } from '@/features/onboarding/components/Step3Preferences';
import { Step5Summary } from '@/features/onboarding/components/Step5Summary';
import { OnboardingLayout } from '@/features/onboarding/layouts/OnboardingLayout';
import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { Button } from '@/shared/ui/button';

interface PatientOnboardingPageProps {
  mode?: 'create' | 'edit';
}

export const PatientOnboardingPage = ({
  mode = 'create',
}: PatientOnboardingPageProps) => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const step = usePatientOnboardingStore((state) => state.step);
  const identity = usePatientOnboardingStore((state) => state.identity);
  const physical = usePatientOnboardingStore((state) => state.physical);
  const goal = usePatientOnboardingStore((state) => state.goal);
  const preferences = usePatientOnboardingStore((state) => state.preferences);
  const hasExistingProfile = usePatientOnboardingStore((state) => state.hasExistingProfile);
  const hydrateFromProfile = usePatientOnboardingStore((state) => state.hydrateFromProfile);
  const nextStep = usePatientOnboardingStore((state) => state.nextStep);
  const prevStep = usePatientOnboardingStore((state) => state.prevStep);
  const reset = usePatientOnboardingStore((state) => state.reset);
  const setHasExistingProfile = usePatientOnboardingStore((state) => state.setHasExistingProfile);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await clinicalApi.getMyProfile();
        const payload: CreateProfilePayload = {
          firstName: profile.firstName,
          paternalLastName: profile.paternalLastName,
          maternalLastName: profile.maternalLastName ?? '',
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          birthDate: profile.birthDate,
          gender: profile.gender,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          dietType: profile.dietType,
          allergies: profile.allergies,
          excludedFoods: profile.excludedFoods,
        };
        hydrateFromProfile(payload, true);
      } catch (error) {
        setHasExistingProfile(false);
        reset();
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [hydrateFromProfile, reset, setHasExistingProfile]);

  const payload = useMemo<CreateProfilePayload>(
    () => ({
      firstName: identity.firstName.trim(),
      paternalLastName: identity.paternalLastName.trim(),
      maternalLastName: identity.maternalLastName.trim(),
      weightKg: physical.weightKg,
      heightCm: physical.heightCm,
      birthDate: physical.birthDate,
      gender: physical.gender,
      activityLevel: physical.activityLevel,
      goal,
      dietType: preferences.dietType,
      allergies: preferences.allergies,
      excludedFoods: preferences.excludedFoods,
    }),
    [goal, identity, physical, preferences]
  );

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (hasExistingProfile) {
        await clinicalApi.updateMyProfile(payload);
      } else {
        await clinicalApi.createProfile(payload);
      }

      navigate(mode === 'edit' ? '/profile' : '/dashboard/patient', { replace: true });
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('patient.common.saveError');
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={5}
      headerAction={
        mode === 'edit' && step === 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft size={16} />
            {t('common.backToProfile')}
          </Button>
        ) : undefined
      }
    >
      {step === 1 ? <Step1Identity onNext={nextStep} /> : null}
      {step === 2 ? <Step2PhysicalData onNext={nextStep} onBack={prevStep} /> : null}
      {step === 3 ? <Step3Goals onNext={nextStep} onBack={prevStep} /> : null}
      {step === 4 ? <Step4Preferences onNext={nextStep} onBack={prevStep} /> : null}
      {step === 5 ? (
        <Step5Summary
          mode={mode}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onBack={prevStep}
          onSubmit={handleSubmit}
        />
      ) : null}
    </OnboardingLayout>
  );
};
