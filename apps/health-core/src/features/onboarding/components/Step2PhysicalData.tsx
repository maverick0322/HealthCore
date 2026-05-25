import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Minus, Plus, Ruler, Weight } from 'lucide-react';

import { usePatientOnboardingStore } from '@/features/onboarding/store/usePatientOnboardingStore';
import { validateBirthDate } from '@/features/onboarding/utils/profileValidation';
import {
  activityLevelOptions,
  formatIsoDateToDisplay,
  genderOptions,
  getOptionDescription,
  getOptionLabel,
  normalizeDateInput,
  parseDisplayDateToIso,
} from '@/features/onboarding/utils/profilePresentation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Step2PhysicalDataProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step2PhysicalData = ({ onNext, onBack }: Step2PhysicalDataProps) => {
  const { t } = useTranslation('onboarding');
  const physical = usePatientOnboardingStore((state) => state.physical);
  const setPhysicalData = usePatientOnboardingStore((state) => state.setPhysicalData);
  const [birthDateInput, setBirthDateInput] = useState(() =>
    physical.birthDate ? formatIsoDateToDisplay(physical.birthDate) : ''
  );
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  useEffect(() => {
    setBirthDateInput(physical.birthDate ? formatIsoDateToDisplay(physical.birthDate) : '');
  }, [physical.birthDate]);

  const birthDateValidationError = useMemo(() => {
    if (!birthDateInput) {
      return t('patient.physical.birthDateErrors.required');
    }

    if (birthDateInput.length < 10) {
      return t('patient.physical.birthDateErrors.incomplete');
    }

    const parsedIsoDate = parseDisplayDateToIso(birthDateInput);
    if (!parsedIsoDate) {
      return t('patient.physical.birthDateErrors.invalid');
    }

    return validateBirthDate(parsedIsoDate, t);
  }, [birthDateInput, t]);

  const handleNext = () => {
    setBirthDateError(birthDateValidationError);
    if (birthDateValidationError) {
      return;
    }
    onNext();
  };

  const handleBirthDateChange = (value: string) => {
    const normalizedValue = normalizeDateInput(value);
    setBirthDateInput(normalizedValue);
    setBirthDateError(null);

    const parsedIsoDate = parseDisplayDateToIso(normalizedValue);
    setPhysicalData({ birthDate: parsedIsoDate ?? '' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t('patient.physical.title')}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{t('patient.physical.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-8 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            <label htmlFor="patient-birth-date" className="text-base font-semibold text-foreground">
              {t('patient.physical.birthDateLabel')}
            </label>
          </div>
          <Input
            id="patient-birth-date"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={birthDateInput}
            placeholder={t('patient.physical.birthDatePlaceholder')}
            aria-invalid={Boolean(birthDateError)}
            onChange={(event) => handleBirthDateChange(event.target.value)}
            className="h-12 bg-card"
          />
          {birthDateError ? <p className="text-xs text-destructive">{birthDateError}</p> : null}
        </div>

        <SliderWithButtons
          icon={Ruler}
          label={t('patient.physical.heightLabel')}
          value={physical.heightCm}
          displayValue={`${physical.heightCm} cm`}
          min={100}
          max={250}
          step={1}
          onChange={(value) => setPhysicalData({ heightCm: value })}
        />

        <SliderWithButtons
          icon={Weight}
          label={t('patient.physical.weightLabel')}
          value={physical.weightKg}
          displayValue={`${physical.weightKg.toFixed(1)} kg`}
          min={40}
          max={200}
          step={0.1}
          onChange={(value) => setPhysicalData({ weightKg: Number(value.toFixed(1)) })}
        />

        <div className="flex flex-col gap-3">
          <label className="text-base font-semibold text-foreground">{t('patient.physical.genderLabel')}</label>
          <div className="grid grid-cols-2 gap-3">
            {genderOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = physical.gender === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPhysicalData({ gender: option.value })}
                  className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-bold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {Icon ? <Icon size={18} /> : null}
                  <span>{getOptionLabel(t, option)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-base font-semibold text-foreground">{t('patient.physical.activityLabel')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activityLevelOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = physical.activityLevel === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPhysicalData({ activityLevel: option.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-primary/15' : 'bg-muted text-foreground'
                      }`}
                    >
                      {Icon ? <Icon size={18} /> : null}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {getOptionLabel(t, option)}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{getOptionDescription(t, option)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Button onClick={onBack} variant="ghost" className="w-full sm:w-auto h-12 text-muted-foreground">
          {t('common.back')}
        </Button>
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

interface SliderWithButtonsProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const SliderWithButtons = ({
  icon: Icon,
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
}: SliderWithButtonsProps) => {
  const precision = step < 1 ? 1 : 0;
  const valueRef = useRef(value);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const skipClickRef = useRef(false);

  valueRef.current = value;

  const handleDecrease = () => onChange(Math.max(min, Number((valueRef.current - step).toFixed(precision))));
  const handleIncrease = () => onChange(Math.min(max, Number((valueRef.current + step).toFixed(precision))));

  const clearHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  useEffect(() => clearHold, []);

  const startHold = (action: () => void) => {
    skipClickRef.current = true;
    action();
    clearHold();
    holdTimeoutRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(action, 90);
    }, 350);
  };

  const handleClick = (action: () => void) => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    action();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          <label className="text-base font-semibold text-foreground">{label}</label>
        </div>
        <span className="text-2xl font-bold text-primary">{displayValue}</span>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            aria-label={`${label} -`}
            onPointerDown={() => startHold(handleDecrease)}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
            onPointerCancel={clearHold}
            onClick={() => handleClick(handleDecrease)}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Minus size={18} />
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(event) => onChange(Number(event.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <button
            type="button"
            aria-label={`${label} +`}
            onPointerDown={() => startHold(handleIncrease)}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
            onPointerCancel={clearHold}
            onClick={() => handleClick(handleIncrease)}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
