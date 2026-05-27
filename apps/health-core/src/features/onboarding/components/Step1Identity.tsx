import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import { normalizeText, validateOptionalName, validateRequiredName } from '@/features/onboarding/utils/profileValidation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Step1IdentityProps {
  onNext: () => void;
  onBackToProfile?: () => void;
}

export const Step1Identity = ({ onNext, onBackToProfile }: Step1IdentityProps) => {
  const { t } = useTranslation('onboarding');
  const identity = usePatientOnboardingStore((state) => state.identity);
  const setIdentityData = usePatientOnboardingStore((state) => state.setIdentityData);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleNext = () => {
    const nextErrors = {
      firstName: validateRequiredName(identity.firstName, t('patient.identity.fields.firstName'), t),
      paternalLastName: validateRequiredName(
        identity.paternalLastName,
        t('patient.identity.fields.paternalLastName'),
        t
      ),
      maternalLastName: validateOptionalName(
        identity.maternalLastName,
        t('patient.identity.fields.maternalLastName'),
        t
      ),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIdentityData({
      firstName: normalizeText(identity.firstName),
      paternalLastName: normalizeText(identity.paternalLastName),
      maternalLastName: identity.maternalLastName.trim() ? normalizeText(identity.maternalLastName) : '',
    });
    onNext();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t('patient.identity.title')}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t('patient.identity.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">
        <CounterField
          id="patient-first-name"
          label={t('patient.identity.fields.firstName')}
          value={identity.firstName}
          maxLength={50}
          error={errors.firstName}
          onChange={(value) => setIdentityData({ firstName: value })}
        />
        <CounterField
          id="patient-paternal-last-name"
          label={t('patient.identity.fields.paternalLastName')}
          value={identity.paternalLastName}
          maxLength={50}
          error={errors.paternalLastName}
          onChange={(value) => setIdentityData({ paternalLastName: value })}
        />
        <CounterField
          id="patient-maternal-last-name"
          label={t('patient.identity.fields.maternalLastNameOptional')}
          value={identity.maternalLastName}
          maxLength={50}
          error={errors.maternalLastName}
          onChange={(value) => setIdentityData({ maternalLastName: value })}
        />
      </div>

      <div className="mt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        {onBackToProfile ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto h-12 text-muted-foreground"
            onClick={onBackToProfile}
          >
            {t('common.backToProfile')}
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={handleNext}
          className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          {t('common.continue')}
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
  onChange: (value: string) => void;
}

const CounterField = ({ id, label, value, maxLength, error, onChange }: CounterFieldProps) => (
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
      onChange={(event) => onChange(event.target.value)}
      className="h-12 bg-card"
    />
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </div>
);
