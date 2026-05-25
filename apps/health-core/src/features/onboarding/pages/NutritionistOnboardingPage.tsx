import { useEffect, useMemo, useState, type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Phone, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TFunction } from 'i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  ClinicAddressPayload,
  ConsultationType,
  NutritionistProfilePayload,
  NutritionistSpecialization,
  PostalCodeLookupResponse,
} from '@/features/clinical/types/clinical.types';
import { OnboardingLayout } from '@/features/onboarding/layouts/OnboardingLayout';
import { useNutritionistOnboardingStore } from '@/features/onboarding/store/useNutritionistOnboardingStore';
import {
  consultationTypeOptions,
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
  getOptionLabel,
  nutritionistSpecializationOptions,
} from '@/features/onboarding/utils/profilePresentation';
import { normalizeText, validateOptionalName, validateRequiredName } from '@/features/onboarding/utils/profileValidation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

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

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [postalLookup, setPostalLookup] = useState<PostalCodeLookupResponse | null>(null);
  const [isPostalLookupLoading, setIsPostalLookupLoading] = useState(false);
  const [postalLookupMessage, setPostalLookupMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const postalCode = contact.clinicAddress.postalCode.trim();

    if (postalCode.length !== 5) {
      setPostalLookup(null);
      setPostalLookupMessage(null);
      setIsPostalLookupLoading(false);
      return;
    }

    let isActive = true;
    setIsPostalLookupLoading(true);
    setPostalLookupMessage(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const lookupResult = await clinicalApi.lookupPostalCode(postalCode);
        if (!isActive) {
          return;
        }

        const currentNeighborhood = useNutritionistOnboardingStore.getState().contact.clinicAddress.neighborhood.trim();
        const normalizedNeighborhood = lookupResult.colonies.includes(currentNeighborhood) ? currentNeighborhood : '';

        setPostalLookup(lookupResult);
        setClinicAddress({
          postalCode: lookupResult.postalCode,
          state: lookupResult.state,
          city: lookupResult.city,
          municipality: lookupResult.municipality,
          neighborhood: normalizedNeighborhood,
        });
        setPostalLookupMessage(t('nutritionist.contact.lookup.match'));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPostalLookup(null);
        const status = (error as { response?: { status?: number } })?.response?.status;
        setPostalLookupMessage(
          status === 404 ? t('nutritionist.contact.lookup.manualFallback') : t('nutritionist.contact.lookup.error')
        );
      } finally {
        if (isActive) {
          setIsPostalLookupLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [contact.clinicAddress.postalCode, setClinicAddress, t]);

  const payload = useMemo<NutritionistProfilePayload>(
    () => ({
      firstName: identity.firstName.trim(),
      paternalLastName: identity.paternalLastName.trim(),
      maternalLastName: identity.maternalLastName.trim(),
      specializations: professional.specializations,
      customSpecialization: professional.customSpecialization.trim(),
      professionalLicense: professional.professionalLicense.trim(),
      consultationTypes,
      phone: contact.phone.trim(),
      clinicAddress: hasAnyAddressValue(contact.clinicAddress) ? sanitizeAddress(contact.clinicAddress) : null,
      bio: bio.trim(),
    }),
    [bio, consultationTypes, contact, identity, professional]
  );

  const handleStepNext = () => {
    const nextErrors = getStepErrors(t, step, {
      identity,
      professional,
      consultationTypes,
      contact,
      bio,
    }, postalLookup);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    nextStep();
  };

  const handleSubmit = async () => {
    const nextErrors = getStepErrors(t, 5, {
      identity,
      professional,
      consultationTypes,
      contact,
      bio,
    }, postalLookup);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isCatalogPostalCode =
    postalLookup?.postalCode === contact.clinicAddress.postalCode.trim() && postalLookup.colonies.length > 0;

  const handlePostalCodeChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 5);
    const currentPostalCode = contact.clinicAddress.postalCode;

    if (sanitizedValue === currentPostalCode) {
      setClinicAddress({ postalCode: sanitizedValue });
      return;
    }

    setPostalLookup(null);
    setPostalLookupMessage(null);
    setClinicAddress({
      postalCode: sanitizedValue,
      state: '',
      city: '',
      municipality: '',
      neighborhood: '',
    });
  };

  return (
    <OnboardingLayout currentStep={step} totalSteps={5}>
      {step === 1 ? (
        <StepFrame
          title={t('nutritionist.identity.title')}
          subtitle={t('nutritionist.identity.subtitle')}
          onBack={null}
          onNext={handleStepNext}
          nextLabel={t('common.continue')}
        >
          <CounterField
            id="nutri-first-name"
            label={t('nutritionist.identity.fields.firstName')}
            value={identity.firstName}
            maxLength={50}
            error={errors.firstName}
            onChange={(value) => setIdentityData({ firstName: value })}
          />
          <CounterField
            id="nutri-paternal-last-name"
            label={t('nutritionist.identity.fields.paternalLastName')}
            value={identity.paternalLastName}
            maxLength={50}
            error={errors.paternalLastName}
            onChange={(value) => setIdentityData({ paternalLastName: value })}
          />
          <CounterField
            id="nutri-maternal-last-name"
            label={t('nutritionist.identity.fields.maternalLastNameOptional')}
            value={identity.maternalLastName}
            maxLength={50}
            error={errors.maternalLastName}
            onChange={(value) => setIdentityData({ maternalLastName: value })}
          />
        </StepFrame>
      ) : null}

      {step === 2 ? (
        <StepFrame
          title={t('nutritionist.professional.title')}
          subtitle={t('nutritionist.professional.subtitle')}
          onBack={prevStep}
          onNext={handleStepNext}
          nextLabel={t('common.continue')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-foreground">
                {t('nutritionist.professional.specializationsLabel')}
              </label>
              <span className="text-xs text-muted-foreground">{professional.specializations.length}/3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nutritionistSpecializationOptions.map((specialization) => {
                const Icon = specialization.icon;
                const isSelected = professional.specializations.includes(specialization.value);

                return (
                  <button
                    key={specialization.value}
                    type="button"
                    onClick={() => toggleSpecialization(specialization.value)}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-primary/15' : 'bg-muted text-foreground'
                        }`}
                      >
                        {Icon ? <Icon size={18} /> : null}
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {getOptionLabel(t, specialization)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.specializations ? <p className="text-xs text-destructive">{errors.specializations}</p> : null}
          </div>

          {professional.specializations.includes('OTHER') ? (
            <CounterField
              id="nutri-custom-specialization"
              label={t('nutritionist.professional.customSpecializationLabel')}
              value={professional.customSpecialization}
              maxLength={60}
              error={errors.customSpecialization}
              onChange={(value) => setProfessionalData({ customSpecialization: value })}
            />
          ) : null}

          <CounterField
            id="nutri-license"
            label={t('nutritionist.professional.licenseLabel')}
            value={professional.professionalLicense}
            maxLength={10}
            error={errors.professionalLicense}
            onChange={(value) => setProfessionalData({ professionalLicense: value })}
          />
        </StepFrame>
      ) : null}

      {step === 3 ? (
        <StepFrame
          title={t('nutritionist.consultation.title')}
          subtitle={t('nutritionist.consultation.subtitle')}
          onBack={prevStep}
          onNext={handleStepNext}
          nextLabel={t('common.continue')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {consultationTypeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = consultationTypes.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleConsultationType(option.value)}
                  className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {Icon ? <Icon size={18} /> : null}
                    <span>{getOptionLabel(t, option)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.consultationTypes ? <p className="text-xs text-destructive">{errors.consultationTypes}</p> : null}
        </StepFrame>
      ) : null}

      {step === 4 ? (
        <StepFrame
          title={t('nutritionist.contact.title')}
          subtitle={t('nutritionist.contact.subtitle')}
          onBack={prevStep}
          onNext={handleStepNext}
          nextLabel={t('common.continue')}
        >
          <CounterField
            id="nutri-phone"
            label={t('nutritionist.contact.fields.phoneOptional')}
            value={contact.phone}
            maxLength={10}
            error={errors.phone}
            onChange={(value) => setContactData({ phone: value })}
          />
          <CounterField
            id="nutri-postal-code"
            label={t('nutritionist.contact.fields.postalCodeOptional')}
            value={contact.clinicAddress.postalCode}
            maxLength={5}
            error={errors.postalCode}
            inputMode="numeric"
            onChange={handlePostalCodeChange}
          />
          {isPostalLookupLoading ? (
            <p className="text-xs text-muted-foreground">{t('nutritionist.contact.lookup.loading')}</p>
          ) : postalLookupMessage ? (
            <p className="text-xs text-muted-foreground">{postalLookupMessage}</p>
          ) : null}
          <CounterField
            id="nutri-state"
            label={t('nutritionist.contact.fields.state')}
            value={contact.clinicAddress.state}
            maxLength={80}
            error={errors.state}
            disabled={isCatalogPostalCode}
            onChange={(value) => setClinicAddress({ state: value })}
          />
          <CounterField
            id="nutri-city"
            label={t('nutritionist.contact.fields.city')}
            value={contact.clinicAddress.city}
            maxLength={80}
            error={errors.city}
            disabled={isCatalogPostalCode}
            onChange={(value) => setClinicAddress({ city: value })}
          />
          <CounterField
            id="nutri-municipality"
            label={t('nutritionist.contact.fields.municipality')}
            value={contact.clinicAddress.municipality}
            maxLength={80}
            error={errors.municipality}
            disabled={isCatalogPostalCode}
            onChange={(value) => setClinicAddress({ municipality: value })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="nutri-neighborhood" className="text-sm font-semibold text-foreground">
                {t('nutritionist.contact.fields.neighborhood')}
              </label>
              {isCatalogPostalCode ? (
                <span className="text-xs text-muted-foreground">{postalLookup.colonies.length}</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {contact.clinicAddress.neighborhood.length}/80
                </span>
              )}
            </div>
            {isCatalogPostalCode ? (
              <Select
                value={contact.clinicAddress.neighborhood}
                onValueChange={(value) => setClinicAddress({ neighborhood: value })}
              >
                <SelectTrigger
                  id="nutri-neighborhood"
                  aria-invalid={Boolean(errors.neighborhood)}
                  className="h-12 bg-card"
                >
                  <SelectValue placeholder={t('nutritionist.contact.lookup.neighborhoodPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {postalLookup.colonies.map((colony) => (
                    <SelectItem key={colony} value={colony}>
                      {colony}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="nutri-neighborhood"
                value={contact.clinicAddress.neighborhood}
                maxLength={80}
                aria-invalid={Boolean(errors.neighborhood)}
                onChange={(event) => setClinicAddress({ neighborhood: event.target.value })}
                className="h-12 bg-card"
              />
            )}
            {errors.neighborhood ? <p className="text-xs text-destructive">{errors.neighborhood}</p> : null}
          </div>
          <CounterField
            id="nutri-street"
            label={t('nutritionist.contact.fields.street')}
            value={contact.clinicAddress.street}
            maxLength={120}
            error={errors.street}
            onChange={(value) => setClinicAddress({ street: value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <CounterField
              id="nutri-exterior-number"
              label={t('nutritionist.contact.fields.exteriorNumber')}
              value={contact.clinicAddress.exteriorNumber}
              maxLength={20}
              error={errors.exteriorNumber}
              onChange={(value) => setClinicAddress({ exteriorNumber: value })}
            />
            <CounterField
              id="nutri-interior-number"
              label={t('nutritionist.contact.fields.interiorNumberOptional')}
              value={contact.clinicAddress.interiorNumber ?? ''}
              maxLength={20}
              error={errors.interiorNumber}
              onChange={(value) => setClinicAddress({ interiorNumber: value })}
            />
          </div>
        </StepFrame>
      ) : null}

      {step === 5 ? (
        <div className="animate-in zoom-in-95 duration-500 flex flex-col gap-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black tracking-tight text-foreground">{t('nutritionist.summary.title')}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{t('nutritionist.summary.subtitle')}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="nutri-bio" className="text-sm font-semibold text-foreground">
                {t('nutritionist.summary.bioLabel')}
              </label>
              <span className="text-xs text-muted-foreground">{bio.length}/500</span>
            </div>
            <Textarea
              id="nutri-bio"
              value={bio}
              maxLength={500}
              aria-invalid={Boolean(errors.bio)}
              onChange={(event) => setBio(event.target.value)}
              className="min-h-32 bg-card"
            />
            {errors.bio ? <p className="text-xs text-destructive">{errors.bio}</p> : null}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <SummaryRow
              icon={User}
              label={t('nutritionist.summary.sections.identity')}
              value={`${identity.firstName} ${identity.paternalLastName} ${identity.maternalLastName}`.trim()}
            />
            <SummaryRow
              icon={ShieldCheck}
              label={t('nutritionist.summary.sections.specializations')}
              value={professional.specializations.map((item) => formatNutritionistSpecializationLabel(t, item)).join(', ')}
              description={
                professional.specializations.includes('OTHER') && professional.customSpecialization.trim()
                  ? t('nutritionist.summary.customSpecialization', {
                      value: professional.customSpecialization.trim(),
                    })
                  : undefined
              }
            />
            <SummaryRow
              icon={Phone}
              label={t('nutritionist.summary.sections.consultation')}
              value={consultationTypes.map((item) => formatConsultationTypeLabel(t, item)).join(', ')}
            />
            <SummaryRow
              icon={FileText}
              label={t('nutritionist.summary.sections.contact')}
              value={contact.phone || t('nutritionist.summary.noPhone')}
              description={formatManualAddress(contact.clinicAddress) ?? t('nutritionist.summary.noAddress')}
            />
          </div>

          {submitError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="mt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <Button onClick={prevStep} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
              {t('common.back')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              {isSubmitting
                ? mode === 'edit'
                  ? t('common.saving')
                  : t('common.creating')
                : mode === 'edit'
                  ? t('common.saveChanges')
                  : t('common.finishAndContinue')}
            </Button>
          </div>
        </div>
      ) : null}
    </OnboardingLayout>
  );
};

interface StepFrameProps {
  title: string;
  subtitle: string;
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel: string;
  children: ReactNode;
}

const StepFrame = ({ title, subtitle, onBack, onNext, nextLabel, children }: StepFrameProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-5">{children}</div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        {onBack ? (
          <Button onClick={onBack} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
            {t('common.back')}
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={onNext}
          className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
};

interface CounterFieldProps {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  error?: string | null;
  disabled?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  onChange: (value: string) => void;
}

const CounterField = ({ id, label, value, maxLength, error, disabled = false, inputMode, onChange }: CounterFieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <span className="text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </span>
    </div>
    <Input
      id={id}
      value={value}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      disabled={disabled}
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 bg-card"
    />
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </div>
);

const SummaryRow = ({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  description?: string;
}) => (
  <div className="space-y-2 border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} className="text-primary" />
      <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-medium text-foreground">{value || '--'}</p>
    {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
  </div>
);

const hasAnyAddressValue = (address: ClinicAddressPayload): boolean =>
  Object.values(address).some((value) => Boolean(value?.trim()));

const sanitizeAddress = (address: ClinicAddressPayload): ClinicAddressPayload => ({
  postalCode: address.postalCode.trim(),
  state: normalizeText(address.state),
  city: normalizeText(address.city),
  municipality: normalizeText(address.municipality),
  neighborhood: normalizeText(address.neighborhood),
  street: normalizeText(address.street),
  exteriorNumber: normalizeText(address.exteriorNumber),
  interiorNumber: address.interiorNumber?.trim() ? normalizeText(address.interiorNumber) : '',
});

const formatManualAddress = (address: ClinicAddressPayload): string | undefined => {
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

const getStepErrors = (
  t: TFunction,
  step: number,
  data: {
    identity: {
      firstName: string;
      paternalLastName: string;
      maternalLastName: string;
    };
    professional: {
      specializations: NutritionistSpecialization[];
      customSpecialization: string;
      professionalLicense: string;
    };
    consultationTypes: ConsultationType[];
    contact: {
      phone: string;
      clinicAddress: ClinicAddressPayload;
    };
    bio: string;
  },
  postalLookup: PostalCodeLookupResponse | null
): Record<string, string | null> => {
  if (step === 1) {
    return {
      firstName: validateRequiredName(data.identity.firstName, t('nutritionist.identity.fields.firstName'), t),
      paternalLastName: validateRequiredName(
        data.identity.paternalLastName,
        t('nutritionist.identity.fields.paternalLastName'),
        t
      ),
      maternalLastName: validateOptionalName(
        data.identity.maternalLastName,
        t('nutritionist.identity.fields.maternalLastName'),
        t
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
