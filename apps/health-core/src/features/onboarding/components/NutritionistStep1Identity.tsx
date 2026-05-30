import { useTranslation } from 'react-i18next';

import type { NutritionistStep1IdentityProps } from '@/features/onboarding/components/nutritionistOnboardingSteps.types';
import { CounterField, StepFrame } from '@/features/onboarding/components/NutritionistOnboardingStepShared';
import { Button } from '@/shared/ui/button';

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
