import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Ruler, Weight, Zap } from 'lucide-react';

interface PatientProfileStatsGridProps {
  heightCm: number;
  weightKg: number;
  age: number | null;
  bmi: {
    value: string;
    categoryKey: 'underweight' | 'normal' | 'overweight' | 'obese';
  } | null;
}

function bmiColor(category: string) {
  switch (category) {
    case 'underweight':
      return 'text-blue-500';
    case 'normal':
      return 'text-emerald-500';
    case 'overweight':
      return 'text-amber-500';
    case 'obese':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

export function PatientProfileStatsGrid({
  heightCm,
  weightKg,
  age,
  bmi,
}: Readonly<PatientProfileStatsGridProps>) {
  const { t } = useTranslation('patient');

  return (
    <div id="section-quick-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        icon={<Ruler size={18} className="text-primary" />}
        label={t('profile.height')}
        value={`${heightCm} cm`}
      />
      <StatCard
        icon={<Weight size={18} className="text-primary" />}
        label={t('profile.weight')}
        value={`${weightKg.toFixed(1)} kg`}
      />
      {bmi ? (
        <StatCard
          icon={<Activity size={18} className={bmiColor(bmi.categoryKey)} />}
          label={t('profile.bmi')}
          value={bmi.value}
          valueClassName={bmiColor(bmi.categoryKey)}
          subValue={t(`profile.bmiCategories.${bmi.categoryKey}`)}
        />
      ) : null}
      <StatCard
        icon={<Zap size={18} className="text-primary" />}
        label={t('profile.age')}
        value={`${age ?? '--'} ${t('profile.years')}`}
      />
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  subValue?: string;
}

function StatCard({ icon, label, value, valueClassName, subValue }: Readonly<StatCardProps>) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <p className={`text-lg font-bold leading-tight ${valueClassName ?? ''}`}>{value}</p>
      {subValue ? <p className="text-xs text-muted-foreground">{subValue}</p> : null}
    </div>
  );
}
