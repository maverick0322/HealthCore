import {
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  PieChart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import { DetailedMealTimeline } from '@/features/tracking/components/DetailedMealTimeline';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WeightHistorySection } from '@/features/patient/components/WeightHistorySection';

function MacroDonut({ p, c, f }: { p: number; c: number; f: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;

  const pDash = (p / 100) * circ;
  const cDash = (c / 100) * circ;
  const fDash = (f / 100) * circ;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="16"
          className="stroke-primary"
          strokeDasharray={`${pDash} ${circ}`}
          strokeDashoffset={0}
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="16"
          className="stroke-amber-400"
          strokeDasharray={`${cDash} ${circ}`}
          strokeDashoffset={-pDash}
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="16"
          className="stroke-sky-400"
          strokeDasharray={`${fDash} ${circ}`}
          strokeDashoffset={-(pDash + cDash)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Macros
        </span>
      </div>
    </div>
  );
}

interface PatientHistoryOverviewSectionProps {
  weightRecords?: WeightRecord[];
  isWeightLoading?: boolean;
  isWeightError?: boolean;
  onRetryWeight?: () => void;
  readOnlyWeightHistory?: boolean;
  historicalMacros?: {
    caloriesHistory: number[];
    caloriesAvg: number;
    macrosAvg: { protein: number; carbs: number; fat: number };
    calorieGoal?: number | null;
    isLoading: boolean;
    error?: string | null;
  };
  onRetryHistoricalMacros?: () => void;
  streakSummary?: {
    currentStreak: number;
    bestStreak: number;
    isLoading: boolean;
    error?: string | null;
  };
  logs: any[];
  isLogsLoading: boolean;
  logsError: string | null;
  selectedDateLabel?: string;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  disableNextDay?: boolean;
  showDateNavigation?: boolean;
  showLogRegistrationCard?: boolean;
  showTrackingInsights?: boolean;
  showMealTimeline?: boolean;
  emptyLogsMessage?: string;
}

export const PatientHistoryOverviewSection = ({
  weightRecords,
  isWeightLoading,
  isWeightError,
  onRetryWeight,
  readOnlyWeightHistory = false,
  historicalMacros,
  onRetryHistoricalMacros,
  streakSummary,
  logs,
  isLogsLoading,
  logsError,
  selectedDateLabel,
  onPreviousDay,
  onNextDay,
  disableNextDay = false,
  showDateNavigation = true,
  showLogRegistrationCard = true,
  showTrackingInsights = Boolean(historicalMacros),
  showMealTimeline = true,
  emptyLogsMessage,
}: Readonly<PatientHistoryOverviewSectionProps>) => {
  const { t } = useTranslation('patient');
  const calorieGoal = historicalMacros?.calorieGoal ?? null;
  const maxCalories = Math.max(
    calorieGoal ?? 0,
    ...(historicalMacros?.caloriesHistory ?? []),
    1
  );

  return (
    <div className="space-y-5">
      {streakSummary ? (
        <div className="grid grid-cols-1 gap-3">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex flex-col gap-1 p-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Award size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {t('history.streak')}
                </span>
              </div>
              {streakSummary.isLoading ? (
                <div className="flex items-center gap-2 py-2 text-amber-600 dark:text-amber-400">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : streakSummary.error ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{streakSummary.error}</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {t('history.streakDays', { count: streakSummary.currentStreak ?? 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('history.bestStreak')}: {streakSummary.bestStreak ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <WeightHistorySection
        records={weightRecords}
        isLoading={isWeightLoading}
        isError={isWeightError}
        onRetry={onRetryWeight}
        readOnly={readOnlyWeightHistory}
      />

      {showTrackingInsights ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card id="card-history-calories">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Flame size={16} className="text-primary" />
                {t('history.calorieTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historicalMacros?.isLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : historicalMacros?.error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                  <p className="text-destructive">{historicalMacros.error}</p>
                  {onRetryHistoricalMacros ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={onRetryHistoricalMacros}
                    >
                      {t('common.retry')}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-bold">{historicalMacros?.caloriesAvg ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{t('history.calorieAvg')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {calorieGoal == null ? '--' : calorieGoal}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('history.calorieGoal')}</p>
                    </div>
                  </div>
                  <div className="flex h-12 items-end gap-1">
                    {(historicalMacros?.caloriesHistory ?? []).map((calories, index) => (
                      <div
                        key={`${calories}-${index}`}
                        className="flex-1 rounded-t-sm bg-amber-500/40 transition-colors hover:bg-amber-500"
                        style={{ height: `${Math.min((calories / maxCalories) * 100, 100)}%` }}
                        title={`${Math.round(calories)} kcal`}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card id="card-history-macros">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <PieChart size={16} className="text-primary" />
                {t('history.macroBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 pt-4">
              {historicalMacros?.isLoading ? (
                <div className="flex h-32 w-full items-center justify-center">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : historicalMacros?.error ? (
                <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                  <p className="text-destructive">{historicalMacros.error}</p>
                </div>
              ) : (
                <>
                  <MacroDonut
                    p={historicalMacros?.macrosAvg.protein ?? 0}
                    c={historicalMacros?.macrosAvg.carbs ?? 0}
                    f={historicalMacros?.macrosAvg.fat ?? 0}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        {t('history.protein')}
                      </div>
                      <span className="font-semibold">{historicalMacros?.macrosAvg.protein ?? 0}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        {t('history.carbs')}
                      </div>
                      <span className="font-semibold">{historicalMacros?.macrosAvg.carbs ?? 0}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                        {t('history.fat')}
                      </div>
                      <span className="font-semibold">{historicalMacros?.macrosAvg.fat ?? 0}%</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {showMealTimeline ? (
        <div className="mt-8 border-t border-border/50 pt-4">
          {showDateNavigation ? (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreviousDay}
                className="gap-1 hover:bg-background"
              >
                <ChevronLeft size={16} /> {t('history.previousDay')}
              </Button>

              <div className="flex items-center gap-2 font-medium">
                <CalendarIcon size={16} className="text-primary" />
                {selectedDateLabel ?? t('history.today')}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNextDay}
                disabled={disableNextDay}
                className="gap-1 hover:bg-background"
              >
                {t('history.nextDay')} <ChevronRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-center rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 font-medium">
                <CalendarIcon size={16} className="text-primary" />
                {selectedDateLabel ?? t('history.today')}
              </div>
            </div>
          )}

          <DetailedMealTimeline
            logs={logs}
            isLoading={isLogsLoading}
            error={logsError}
            emptyMessage={emptyLogsMessage}
            showAddCard={showLogRegistrationCard}
          />
        </div>
      ) : null}
    </div>
  );
};
