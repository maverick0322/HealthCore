import { type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Phone, ShieldCheck, User } from 'lucide-react';

import type {
  ClinicAddressPayload,
  ConsultationType,
  NutritionistSpecialization,
} from '@/features/clinical/types/clinical.types';
import {
  consultationTypeOptions,
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
  getOptionLabel,
  nutritionistSpecializationOptions,
} from '@/features/onboarding/utils/profilePresentation';
import { formatManualAddress } from '@/features/onboarding/utils/nutritionistOnboarding';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

interface IdentityState {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

interface ProfessionalState {
  specializations: NutritionistSpecialization[];
  customSpecialization: string;
  professionalLicense: string;
}

interface ContactState {
  phone: string;
  clinicAddress: ClinicAddressPayload;
}

interface PostalLookupState {
  postalCode: string;
  colonies: string[];
}

interface NutritionistStep1IdentityProps {
  mode: 'create' | 'edit';
  identity: IdentityState;
  errors: Record<string, string | null>;
  onChange: (patch: Partial<IdentityState>) => void;
  onNext: () => void;
  onBackToProfile: () => void;
}

export const NutritionistStep1Identity = ({
  mode,
  identity,
  errors,
  onChange,
  onNext,
  onBackToProfile,
}: NutritionistStep1IdentityProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <StepFrame
      title={t('nutritionist.identity.title')}
      subtitle={t('nutritionist.identity.subtitle')}
      onBack={null}
      onNext={onNext}
      nextLabel={t('common.continue')}
      leadingAction={
        mode === 'edit' ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto h-12 text-muted-foreground"
            onClick={onBackToProfile}
          >
            {t('common.backToProfile')}
          </Button>
        ) : undefined
      }
    >
      <CounterField
        id="nutri-first-name"
        label={t('nutritionist.identity.fields.firstName')}
        value={identity.firstName}
        maxLength={50}
        error={errors.firstName}
        onChange={(value) => onChange({ firstName: value })}
      />
      <CounterField
        id="nutri-paternal-last-name"
        label={t('nutritionist.identity.fields.paternalLastName')}
        value={identity.paternalLastName}
        maxLength={50}
        error={errors.paternalLastName}
        onChange={(value) => onChange({ paternalLastName: value })}
      />
      <CounterField
        id="nutri-maternal-last-name"
        label={t('nutritionist.identity.fields.maternalLastNameOptional')}
        value={identity.maternalLastName}
        maxLength={50}
        error={errors.maternalLastName}
        onChange={(value) => onChange({ maternalLastName: value })}
      />
    </StepFrame>
  );
};

interface NutritionistStep2ProfessionalProps {
  professional: ProfessionalState;
  errors: Record<string, string | null>;
  onBack: () => void;
  onNext: () => void;
  onToggleSpecialization: (value: NutritionistSpecialization) => void;
  onChange: (patch: Partial<ProfessionalState>) => void;
}

export const NutritionistStep2Professional = ({
  professional,
  errors,
  onBack,
  onNext,
  onToggleSpecialization,
  onChange,
}: NutritionistStep2ProfessionalProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <StepFrame
      title={t('nutritionist.professional.title')}
      subtitle={t('nutritionist.professional.subtitle')}
      onBack={onBack}
      onNext={onNext}
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
                onClick={() => onToggleSpecialization(specialization.value)}
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
          onChange={(value) => onChange({ customSpecialization: value })}
        />
      ) : null}

      <CounterField
        id="nutri-license"
        label={t('nutritionist.professional.licenseLabel')}
        value={professional.professionalLicense}
        maxLength={10}
        error={errors.professionalLicense}
        onChange={(value) => onChange({ professionalLicense: value })}
      />
    </StepFrame>
  );
};

interface NutritionistStep3ConsultationProps {
  consultationTypes: ConsultationType[];
  error?: string | null;
  onBack: () => void;
  onNext: () => void;
  onToggleConsultationType: (value: ConsultationType) => void;
}

export const NutritionistStep3Consultation = ({
  consultationTypes,
  error,
  onBack,
  onNext,
  onToggleConsultationType,
}: NutritionistStep3ConsultationProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <StepFrame
      title={t('nutritionist.consultation.title')}
      subtitle={t('nutritionist.consultation.subtitle')}
      onBack={onBack}
      onNext={onNext}
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
              onClick={() => onToggleConsultationType(option.value)}
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </StepFrame>
  );
};

interface NutritionistStep4ContactProps {
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

export const NutritionistStep4Contact = ({
  contact,
  errors,
  postalLookup,
  isPostalLookupLoading,
  postalLookupMessage,
  isCatalogPostalCode,
  onBack,
  onNext,
  onPhoneChange,
  onPostalCodeChange,
  onClinicAddressChange,
}: NutritionistStep4ContactProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <StepFrame
      title={t('nutritionist.contact.title')}
      subtitle={t('nutritionist.contact.subtitle')}
      onBack={onBack}
      onNext={onNext}
      nextLabel={t('common.continue')}
    >
      <CounterField
        id="nutri-phone"
        label={t('nutritionist.contact.fields.phoneOptional')}
        value={contact.phone}
        maxLength={10}
        error={errors.phone}
        onChange={onPhoneChange}
      />
      <CounterField
        id="nutri-postal-code"
        label={t('nutritionist.contact.fields.postalCodeOptional')}
        value={contact.clinicAddress.postalCode}
        maxLength={5}
        error={errors.postalCode}
        inputMode="numeric"
        onChange={onPostalCodeChange}
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
        onChange={(value) => onClinicAddressChange({ state: value })}
      />
      <CounterField
        id="nutri-city"
        label={t('nutritionist.contact.fields.city')}
        value={contact.clinicAddress.city}
        maxLength={80}
        error={errors.city}
        disabled={isCatalogPostalCode}
        onChange={(value) => onClinicAddressChange({ city: value })}
      />
      <CounterField
        id="nutri-municipality"
        label={t('nutritionist.contact.fields.municipality')}
        value={contact.clinicAddress.municipality}
        maxLength={80}
        error={errors.municipality}
        disabled={isCatalogPostalCode}
        onChange={(value) => onClinicAddressChange({ municipality: value })}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="nutri-neighborhood" className="text-sm font-semibold text-foreground">
            {t('nutritionist.contact.fields.neighborhood')}
          </label>
          {isCatalogPostalCode && postalLookup ? (
            <span className="text-xs text-muted-foreground">{postalLookup.colonies.length}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {contact.clinicAddress.neighborhood.length}/80
            </span>
          )}
        </div>
        {isCatalogPostalCode && postalLookup ? (
          <Select
            value={contact.clinicAddress.neighborhood}
            onValueChange={(value) => onClinicAddressChange({ neighborhood: value })}
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
            onChange={(event) => onClinicAddressChange({ neighborhood: event.target.value })}
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
        onChange={(value) => onClinicAddressChange({ street: value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <CounterField
          id="nutri-exterior-number"
          label={t('nutritionist.contact.fields.exteriorNumber')}
          value={contact.clinicAddress.exteriorNumber}
          maxLength={20}
          error={errors.exteriorNumber}
          onChange={(value) => onClinicAddressChange({ exteriorNumber: value })}
        />
        <CounterField
          id="nutri-interior-number"
          label={t('nutritionist.contact.fields.interiorNumberOptional')}
          value={contact.clinicAddress.interiorNumber ?? ''}
          maxLength={20}
          error={errors.interiorNumber}
          onChange={(value) => onClinicAddressChange({ interiorNumber: value })}
        />
      </div>
    </StepFrame>
  );
};

interface NutritionistStep5SummaryProps {
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

export const NutritionistStep5Summary = ({
  mode,
  identity,
  professional,
  consultationTypes,
  contact,
  bio,
  errors,
  submitError,
  isSubmitting,
  onBack,
  onSubmit,
  onBioChange,
}: NutritionistStep5SummaryProps) => {
  const { t } = useTranslation('onboarding');

  return (
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
          onChange={(event) => onBioChange(event.target.value)}
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
        <Button onClick={onBack} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
          {t('common.back')}
        </Button>
        <Button
          onClick={onSubmit}
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
  );
};

interface StepFrameProps {
  title: string;
  subtitle: string;
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel: string;
  children: ReactNode;
  leadingAction?: ReactNode;
}

const StepFrame = ({ title, subtitle, onBack, onNext, nextLabel, children, leadingAction }: StepFrameProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-5">{children}</div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        {leadingAction ? (
          leadingAction
        ) : onBack ? (
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
