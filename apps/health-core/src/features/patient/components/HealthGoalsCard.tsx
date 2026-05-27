import { Flame, AlertCircle } from 'lucide-react'; // <-- Agregado AlertCircle
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useHealthGoals } from '../hooks/useHealthGoals';
import { useTodaySummary } from '@/features/tracking/hooks/useTodaySummary';

/**
 * Utility functions to prevent IEEE 754 floating-point artifacts in the UI.
 * Keeps business logic clean by ensuring visual rounding is handled only at the presentation layer.
 */
const formatMacro = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

const formatCalories = (value: number | undefined | null): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.round(value);
};

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className="stroke-primary transition-all duration-700"
      />
    </svg>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatMacro(value)}g / {formatMacro(goal)}g
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const HealthGoalsCard = () => {
  const { t } = useTranslation('patient');
  const { data, isLoading: isGoalsLoading, isError: isGoalsError } = useHealthGoals();
  
  // NUEVO: Extrayendo el error de tracking también
  const { summary, isLoading: isTrackingLoading, error: trackingError } = useTodaySummary();

  if (isGoalsLoading || isTrackingLoading) {
    return (
      <Card id="card-health-goals" className="h-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            {t('dashboard.caloriesCard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 animate-pulse">
          <div className="mx-auto w-[140px] h-[140px] rounded-full bg-muted/60" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-muted/60" />
            <div className="h-12 rounded-lg bg-muted/60" />
            <div className="h-12 rounded-lg bg-muted/60" />
          </div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-4 rounded bg-muted/60" />
            <div className="h-4 rounded bg-muted/60" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // NUEVO: Verificando ambos errores (Goals o Tracking) y mostrando una UI bonita
  if (isGoalsError || trackingError || !data) {
    return (
      <Card id="card-health-goals" className="h-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            {t('dashboard.caloriesCard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3 opacity-80" />
          <p className="text-sm font-medium text-destructive">
            {t('errors.loadFailed', 'No pudimos cargar tus registros.')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 px-4">
            {t('errors.tryAgainLater', 'El servicio podría estar inactivo, por favor intenta más tarde.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Raw values from state
  const rawCaloriesConsumed = summary?.totalCalories ?? 0;
  const rawProteinConsumed = summary?.totalProteins ?? 0;
  const rawCarbsConsumed = summary?.totalCarbs ?? 0;
  const rawFatConsumed = summary?.totalFats ?? 0;
  const rawCaloriesGoal = data.targetCalories;

  // Formatted values for logic and display
  const caloriesConsumed = formatCalories(rawCaloriesConsumed);
  const caloriesGoal = formatCalories(rawCaloriesGoal);
  const remaining = caloriesGoal - caloriesConsumed;
  const remainingDisplay = remaining < 0 ? `+${Math.abs(remaining)}` : `${remaining}`;
  const caloriePct = caloriesGoal > 0 ? Math.round((caloriesConsumed / caloriesGoal) * 100) : 0;

  return (
    <Card id="card-health-goals" className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame size={16} className="text-primary" />
          {t('dashboard.caloriesCard')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-4 pb-5 space-y-4">
        <div className="relative flex items-center justify-center">
          <CalorieRing consumed={caloriesConsumed} goal={caloriesGoal} />
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold leading-none">{caloriesConsumed}</span>
            <span className="text-xs text-muted-foreground">{t('dashboard.kcal')}</span>
          </div>
        </div>

        <div className="flex justify-around w-full text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.goal')}</p>
            <p className="font-semibold text-sm">{caloriesGoal}</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.remaining')}</p>
            <p className={`font-semibold text-sm ${remaining < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
              {remainingDisplay}
            </p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">%</p>
            <p className="font-semibold text-sm">{caloriePct}%</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <MacroBar label={t('dashboard.protein')} value={rawProteinConsumed} goal={data.targetProtein} color="bg-primary" />
          <MacroBar label={t('dashboard.carbs')} value={rawCarbsConsumed} goal={data.targetCarbs} color="bg-amber-400" />
          <MacroBar label={t('dashboard.fat')} value={rawFatConsumed} goal={data.targetFat} color="bg-sky-400" />
        </div>
      </CardContent>
    </Card>
  );
};