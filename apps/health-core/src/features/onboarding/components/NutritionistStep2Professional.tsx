import { useTranslation } from 'react-i18next';

import type { NutritionistStep2ProfessionalProps } from '@/features/onboarding/components/nutritionistOnboardingSteps.types';
import { CounterField, StepFrame } from '@/features/onboarding/components/NutritionistOnboardingStepShared';
import {
  getOptionLabel,
  nutritionistSpecializationOptions,
} from '@/features/onboarding/utils/profilePresentation';

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
