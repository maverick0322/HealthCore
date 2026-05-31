import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type {
  NutritionistProfilePayload,
} from '@/features/clinical/types/clinical.types';
import { OnboardingLayout } from '@/features/onboarding/layouts/OnboardingLayout';
import { useNutritionistOnboardingBootstrap } from '@/features/onboarding/hooks/useNutritionistOnboardingBootstrap';
import { useNutritionistPostalCodeLookup } from '@/features/onboarding/hooks/useNutritionistPostalCodeLookup';
import { useNutritionistOnboardingSubmit } from '@/features/onboarding/hooks/useNutritionistOnboardingSubmit';
import { useNutritionistOnboardingStore } from '@/features/onboarding/store/useNutritionistOnboardingStore';
import {
  NutritionistStep1Identity,
  NutritionistStep2Professional,
  NutritionistStep3Consultation,
  NutritionistStep4Contact,
  NutritionistStep5Summary,
} from '@/features/onboarding/components/NutritionistOnboardingSteps';
import {
  buildNutritionistProfilePayload,
  getNutritionistOnboardingStepErrors,
} from '@/features/onboarding/utils/nutritionistOnboarding';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

interface NutritionistOnboardingPageProps {
  mode?: 'create' | 'edit';
}

export const NutritionistOnboardingPage = ({ mode = 'create' }: NutritionistOnboardingPageProps) => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const step = useNutritionistOnboardingStore((state) => state.step);
  const identity = useNutritionistOnboardingStore((state) => state.identity);
  const professional = useNutritionistOnboardingStore((state) => state.professional);
  const consultationTypes = useNutritionistOnboardingStore((state) => state.consultationTypes);
  const contact = useNutritionistOnboardingStore((state) => state.contact);
  const bio = useNutritionistOnboardingStore((state) => state.bio);
  const hasExistingProfile = useNutritionistOnboardingStore((state) => state.hasExistingProfile);
  const setIdentityData = useNutritionistOnboardingStore((state) => state.setIdentityData);
  const setProfessionalData = useNutritionistOnboardingStore((state) => state.setProfessionalData);
  const toggleSpecialization = useNutritionistOnboardingStore((state) => state.toggleSpecialization);
  const toggleConsultationType = useNutritionistOnboardingStore((state) => state.toggleConsultationType);
  const setContactData = useNutritionistOnboardingStore((state) => state.setContactData);
  const setClinicAddress = useNutritionistOnboardingStore((state) => state.setClinicAddress);
  const setBio = useNutritionistOnboardingStore((state) => state.setBio);
  const nextStep = useNutritionistOnboardingStore((state) => state.nextStep);
  const prevStep = useNutritionistOnboardingStore((state) => state.prevStep);
  const reset = useNutritionistOnboardingStore((state) => state.reset);
  const hydrateFromProfile = useNutritionistOnboardingStore((state) => state.hydrateFromProfile);
  const setHasExistingProfile = useNutritionistOnboardingStore((state) => state.setHasExistingProfile);

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { isLoadingProfile } = useNutritionistOnboardingBootstrap({
    hydrateFromProfile,
    setHasExistingProfile,
    reset,
  });
  const {
    postalLookup,
    isPostalLookupLoading,
    postalLookupMessage,
    handlePostalCodeChange,
  } = useNutritionistPostalCodeLookup({
    postalCode: contact.clinicAddress.postalCode,
    getCurrentNeighborhood: () =>
      useNutritionistOnboardingStore.getState().contact.clinicAddress.neighborhood.trim(),
    setClinicAddress,
  });
  const { isSubmitting, submitError, handleSubmit: submitNutritionistOnboarding } =
    useNutritionistOnboardingSubmit({
      mode,
      hasExistingProfile,
    });

  const payload = useMemo<NutritionistProfilePayload>(
    () =>
      buildNutritionistProfilePayload({
        identity,
        professional,
        consultationTypes,
        contact,
        bio,
      }),
    [bio, consultationTypes, contact, identity, professional]
  );

  const handleStepNext = () => {
    const nextErrors = getNutritionistOnboardingStepErrors(
      t,
      step,
      {
        identity,
        professional,
        consultationTypes,
        contact,
        bio,
      },
      postalLookup,
    );
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    nextStep();
  };

  const handleSubmit = async () => {
    const nextErrors = getNutritionistOnboardingStepErrors(
      t,
      5,
      {
        identity,
        professional,
        consultationTypes,
        contact,
        bio,
      },
      postalLookup,
    );
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    await submitNutritionistOnboarding(payload);
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isCatalogPostalCode =
    postalLookup?.postalCode === contact.clinicAddress.postalCode.trim() && postalLookup.colonies.length > 0;

  return (
    <OnboardingLayout currentStep={step} totalSteps={5}>
      {step === 1 ? (
        <NutritionistStep1Identity
          mode={mode}
          identity={identity}
          errors={errors}
          onChange={setIdentityData}
          onNext={handleStepNext}
          onBackToProfile={() => navigate('/profile/nutritionist')}
        />
      ) : null}

      {step === 2 ? (
        <NutritionistStep2Professional
          professional={professional}
          errors={errors}
          onBack={prevStep}
          onNext={handleStepNext}
          onToggleSpecialization={toggleSpecialization}
          onChange={setProfessionalData}
        />
      ) : null}

      {step === 3 ? (
        <NutritionistStep3Consultation
          consultationTypes={consultationTypes}
          error={errors.consultationTypes}
          onBack={prevStep}
          onNext={handleStepNext}
          onToggleConsultationType={toggleConsultationType}
        />
      ) : null}

      {step === 4 ? (
        <NutritionistStep4Contact
          contact={contact}
          errors={errors}
          postalLookup={postalLookup}
          isPostalLookupLoading={isPostalLookupLoading}
          postalLookupMessage={postalLookupMessage}
          isCatalogPostalCode={isCatalogPostalCode}
          onBack={prevStep}
          onNext={handleStepNext}
          onPhoneChange={(value) => setContactData({ phone: value })}
          onPostalCodeChange={handlePostalCodeChange}
          onClinicAddressChange={setClinicAddress}
        />
      ) : null}

      {step === 5 ? (
        <NutritionistStep5Summary
          mode={mode}
          identity={identity}
          professional={professional}
          consultationTypes={consultationTypes}
          contact={contact}
          bio={bio}
          errors={errors}
          submitError={submitError}
          isSubmitting={isSubmitting}
          onBack={prevStep}
          onSubmit={handleSubmit}
          onBioChange={setBio}
        />
      ) : null}
    </OnboardingLayout>
  );
};

