import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import { allergyOptions, dietOptions, getOptionLabel } from '@/features/onboarding/utils/profilePresentation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Step4PreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step4Preferences = ({ onNext, onBack }: Step4PreferencesProps) => {
  const { t } = useTranslation('onboarding');
  const preferences = usePatientOnboardingStore((state) => state.preferences);
  const setPreferences = usePatientOnboardingStore((state) => state.setPreferences);
  const toggleAllergy = usePatientOnboardingStore((state) => state.toggleAllergy);
  const addExcludedFood = usePatientOnboardingStore((state) => state.addExcludedFood);
  const removeExcludedFood = usePatientOnboardingStore((state) => state.removeExcludedFood);
  const [foodInput, setFoodInput] = useState('');

  const handleAddFood = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && foodInput.trim()) {
      addExcludedFood(foodInput.trim());
      setFoodInput('');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t('patient.preferences.title')}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t('patient.preferences.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t('patient.preferences.dietType')}
        </h3>
        <div className="flex flex-wrap gap-3">
          {dietOptions.map((diet) => (
            <button
              key={diet.value}
              type="button"
              onClick={() => setPreferences({ dietType: diet.value })}
              className={`px-5 py-2 rounded-xl border-2 font-medium transition-colors ${
                preferences.dietType === diet.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-primary/50'
              }`}
            >
              {getOptionLabel(t, diet)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t('patient.preferences.allergies')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {allergyOptions.map((allergy) => {
            const isChecked = preferences.allergies.includes(allergy.value);
            const Icon = allergy.icon;

            return (
              <button
                key={allergy.value}
                type="button"
                onClick={() => toggleAllergy(allergy.value)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  isChecked
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isChecked ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'
                  }`}
                >
                  {Icon ? <Icon size={18} /> : null}
                </span>
                <span className={`text-sm font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                  {getOptionLabel(t, allergy)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t('patient.preferences.avoidFoods')}
        </h3>
        <Input
          type="text"
          className="w-full px-4 py-6 bg-background border-2 border-border rounded-xl h-12"
          placeholder={t('patient.preferences.avoidPlaceholder')}
          value={foodInput}
          maxLength={40}
          onChange={(event) => setFoodInput(event.target.value)}
          onKeyDown={handleAddFood}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {preferences.excludedFoods.map((food) => (
            <div
              key={food}
              className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm font-medium text-foreground"
            >
              {food}
              <button
                type="button"
                onClick={() => removeExcludedFood(food)}
                className="ml-1 outline-none text-muted-foreground hover:text-destructive"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border pt-8">
        <Button onClick={onBack} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
          {t('common.back')}
        </Button>
        <Button
          onClick={onNext}
          className="w-full sm:w-72 h-14 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-lg"
        >
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
};
