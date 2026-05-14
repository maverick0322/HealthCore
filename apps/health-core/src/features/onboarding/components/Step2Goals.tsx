import { useTranslation } from 'react-i18next';

import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import { getOptionDescription, getOptionLabel, patientGoalOptions } from '@/features/onboarding/utils/profilePresentation';
import { Button } from '@/shared/ui/button';

interface Step3GoalsProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step3Goals = ({ onNext, onBack }: Step3GoalsProps) => {
  const { t } = useTranslation('onboarding');
  const goal = usePatientOnboardingStore((state) => state.goal);
  const setGoal = usePatientOnboardingStore((state) => state.setGoal);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-10">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t('patient.goals.title')}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t('patient.goals.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {patientGoalOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = goal === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setGoal(option.value)}
              className={`h-full w-full flex flex-col items-start text-left p-6 bg-card border-2 rounded-xl shadow-sm transition-all duration-200 ${
                isSelected
                  ? 'border-primary ring-4 ring-primary/10'
                  : 'border-transparent hover:shadow-md hover:border-border'
              }`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {Icon ? <Icon size={22} /> : null}
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{getOptionLabel(t, option)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{getOptionDescription(t, option)}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Button onClick={onBack} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
          {t('common.back')}
        </Button>
        <Button
          onClick={onNext}
          className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
};
