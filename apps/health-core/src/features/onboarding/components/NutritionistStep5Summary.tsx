import { useTranslation } from 'react-i18next';
import { FileText, Phone, ShieldCheck, User } from 'lucide-react';

import type { NutritionistStep5SummaryProps } from '@/features/onboarding/components/nutritionistOnboardingSteps.types';
import { SummaryRow } from '@/features/onboarding/components/NutritionistOnboardingStepShared';
import {
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
} from '@/features/onboarding/utils/profilePresentation';
import { formatManualAddress } from '@/features/onboarding/utils/nutritionistOnboarding';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

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
