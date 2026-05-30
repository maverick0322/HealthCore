import { useTranslation } from 'react-i18next';

import type { NutritionistStep3ConsultationProps } from '@/features/onboarding/components/nutritionistOnboardingSteps.types';
import { StepFrame } from '@/features/onboarding/components/NutritionistOnboardingStepShared';
import { consultationTypeOptions, getOptionLabel } from '@/features/onboarding/utils/profilePresentation';

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
