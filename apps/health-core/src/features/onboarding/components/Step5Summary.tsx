import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Ruler, Target, User } from 'lucide-react';

import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import {
  formatActivityLevelLabel,
  formatAllergyLabel,
  formatDietLabel,
  formatGenderLabel,
  formatIsoDateToDisplay,
  formatPatientGoalLabel,
} from '@/features/onboarding/utils/profilePresentation';
import { calculateAgeFromBirthDate } from '@/features/onboarding/utils/profileValidation';
import { Button } from '@/shared/ui/button';

interface Step5SummaryProps {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

export const Step5Summary = ({
  mode,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: Step5SummaryProps) => {
  const { t } = useTranslation('onboarding');
  const identity = usePatientOnboardingStore((state) => state.identity);
  const physical = usePatientOnboardingStore((state) => state.physical);
  const goal = usePatientOnboardingStore((state) => state.goal);
  const preferences = usePatientOnboardingStore((state) => state.preferences);
  const age = calculateAgeFromBirthDate(physical.birthDate);
  const allergyLabel =
    preferences.allergies.length > 0
      ? preferences.allergies.map((allergy) => formatAllergyLabel(t, allergy)).join(', ')
      : t('patient.summary.noAllergies');

  return (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center">
      <div className="mb-10 flex w-full flex-col gap-3 text-center">
        <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
          {t('patient.summary.title')}
        </h1>
        <p className="text-muted-foreground text-base font-normal leading-relaxed">{t('patient.summary.subtitle')}</p>
      </div>

      <div className="bg-card mb-8 w-full overflow-hidden rounded-xl border border-border shadow-sm transition-colors">
        <div className="space-y-6 p-6 md:p-8">
          <SummaryRow
            icon={User}
            title={t('patient.summary.sections.identity')}
            value={`${identity.firstName} ${identity.paternalLastName} ${identity.maternalLastName}`.trim()}
          />
          <SummaryRow
            icon={Ruler}
            title={t('patient.summary.sections.physical')}
            value={t('patient.summary.physicalValue', {
              age: age ?? '--',
              height: physical.heightCm,
              weight: physical.weightKg.toFixed(1),
            })}
            description={t('patient.summary.physicalDescription', {
              birthDate: formatIsoDateToDisplay(physical.birthDate),
              gender: formatGenderLabel(t, physical.gender),
              activity: formatActivityLevelLabel(t, physical.activityLevel, true),
            })}
          />
          <SummaryRow
            icon={Target}
            title={t('patient.summary.sections.goal')}
            value={formatPatientGoalLabel(t, goal)}
          />
          <SummaryRow
            icon={Leaf}
            title={t('patient.summary.sections.preferences')}
            value={formatDietLabel(t, preferences.dietType)}
            description={t('patient.summary.allergiesDescription', { allergies: allergyLabel })}
          />
        </div>
      </div>

      {submitError ? (
        <div className="mb-4 w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}

      <div className="flex w-full flex-col items-center gap-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          {isSubmitting
            ? mode === 'edit'
              ? t('common.saving')
              : t('common.creating')
            : mode === 'edit'
              ? t('common.saveChanges')
              : t('common.finishAndContinue')}
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:bg-transparent hover:text-primary"
        >
          {t('patient.summary.editButton')}
        </Button>
      </div>
    </div>
  );
};

interface SummaryRowProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  description?: string;
}

const SummaryRow = ({ icon: Icon, title, value, description }: SummaryRowProps) => (
  <div className="space-y-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} className="text-primary" />
      <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
    </div>
    <p className="text-foreground text-lg font-semibold">{value}</p>
    {description ? <p className="text-muted-foreground text-sm leading-relaxed">{description}</p> : null}
  </div>
);
