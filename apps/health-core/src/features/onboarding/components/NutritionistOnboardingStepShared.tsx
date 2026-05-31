import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface StepFrameProps {
  title: string;
  subtitle: string;
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel: string;
  children: ReactNode;
  leadingAction?: ReactNode;
}

export const StepFrame = ({
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel,
  children,
  leadingAction,
}: StepFrameProps) => {
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

export const CounterField = ({
  id,
  label,
  value,
  maxLength,
  error,
  disabled = false,
  inputMode,
  onChange,
}: CounterFieldProps) => (
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

export const SummaryRow = ({
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
