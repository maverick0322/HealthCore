import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react';

import { useRegisterWeight } from '@/features/patient/hooks/useRegisterWeight';
import { useWeightHistory } from '@/features/patient/hooks/useWeightHistory';
import {
  getDashboardWeightStats,
  getLatestWeightRecords,
  getWeightValidationErrors,
} from '@/features/patient/utils/weightHistory';
import { todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ConfirmModal } from '@/shared/components/ConfirmModal';

const WEIGHT_INPUT_MAX_LENGTH = 5;

const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

const formatVariation = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

const getSparklineChart = (records: { weightKg: number; date: string }[]) => {
  const width = 280;
  const height = 112;
  const paddingX = 16;
  const paddingTop = 24;
  const paddingBottom = 20;
  const values = records.map((record) => record.weightKg);

  if (values.length === 0) {
    return {
      height,
      points: '',
      coordinates: [] as Array<{ x: number; y: number; weightKg: number; date: string }>,
      width,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = max - min || 1;

  const coordinates = records.map((record, index) => {
    const value = record.weightKg;
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(values.length - 1, 1);
    const y = height - paddingBottom - ((value - min) / yRange) * (height - paddingTop - paddingBottom);

    return {
      date: record.date,
      weightKg: record.weightKg,
      x,
      y,
    };
  });

  return {
    height,
    points: coordinates.map((point) => `${point.x},${point.y}`).join(' '),
    coordinates,
    width,
  };
};

const formatChartDate = (date: string, locale: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

const formatLongDate = (date: string, locale: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatChartWeight = (value: number) => `${value.toFixed(1)} kg`;

export const DashboardWeightCard = () => {
  const { t, i18n } = useTranslation('patient');
  const { data, isLoading, isError, refetch } = useWeightHistory();
  const registerWeight = useRegisterWeight();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(todayDateKey());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ weightKg?: string; date?: string }>({});

  const latestRecords = useMemo(() => getLatestWeightRecords(data, 7), [data]);
  const stats = useMemo(() => getDashboardWeightStats(latestRecords), [latestRecords]);
  const sparklineChart = useMemo(
    () => getSparklineChart(latestRecords),
    [latestRecords]
  );

  const resetDialog = () => {
    setWeightInput('');
    setDateInput(todayDateKey());
    setFieldErrors({});
    setSubmitError(null);
    setConfirmOpen(false);
  };

  const openEntryDialog = () => {
    setDialogOpen(true);
    setConfirmOpen(false);
  };

  const dismissEntryFlow = () => {
    setDialogOpen(false);
    setConfirmOpen(false);
    resetDialog();
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setDialogOpen(true);
      return;
    }

    dismissEntryFlow();
  };

  const handleReviewBeforeSave = () => {
    const validationErrors = getWeightValidationErrors(weightInput, dateInput, t);
    setFieldErrors(validationErrors);
    setSubmitError(null);

    if (validationErrors.weightKg || validationErrors.date) {
      return;
    }

    setDialogOpen(false);
    setConfirmOpen(true);
  };

  const handleBackToForm = () => {
    setConfirmOpen(false);
    setDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      await registerWeight.mutateAsync({
        weightKg: Number(weightInput),
        date: dateInput,
      });
      dismissEntryFlow();
    } catch (error: any) {
      setConfirmOpen(false);
      setDialogOpen(true);
      setSubmitError(
        error?.response?.data?.message ?? t('dashboard.weightForm.saveError')
      );
    }
  };

  const latestDateLabel = stats.latestDate
    ? new Date(`${stats.latestDate}T12:00:00`).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : t('dashboard.weightCard.noDate');

  const variationTone =
    stats.variationKg == null
      ? 'text-muted-foreground'
      : stats.variationKg <= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400';

  return (
    <>
      <Card id="card-weight-dashboard">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingDown size={16} className="text-primary" />
            {t('dashboard.weightEvolution')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-28 rounded-2xl bg-muted animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">{t('dashboard.weightErrorMessage')}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : latestRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
              <p className="text-sm text-muted-foreground">{t('dashboard.noWeightData')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.weightCard.emptyHelp')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('dashboard.weightCard.last7Records')}</span>
                  <span>{latestDateLabel}</span>
                </div>

                <svg viewBox={`0 0 ${sparklineChart.width} ${sparklineChart.height}`} className="h-32 w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                    points={sparklineChart.points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sparklineChart.coordinates.map((point, index) => (
                    <g key={point.date}>
                      <text
                        x={point.x}
                        y={Math.max(point.y - 10, 12)}
                        textAnchor="middle"
                        className="fill-foreground text-[10px] font-medium"
                      >
                        {formatChartWeight(point.weightKg)}
                      </text>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={index === sparklineChart.coordinates.length - 1 ? 4.5 : 3.5}
                        className={index === sparklineChart.coordinates.length - 1 ? 'fill-primary' : 'fill-primary/60'}
                      >
                        <title>{`${point.date}: ${point.weightKg.toFixed(1)} kg`}</title>
                      </circle>
                      <text
                        x={point.x}
                        y={sparklineChart.height - 4}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px]"
                      >
                        {formatChartDate(point.date, i18n.language)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weightCard.latestWeight')}</p>
                  <p className="mt-1 text-sm font-semibold">{formatWeight(stats.latestWeightKg)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weightCard.lastRecord')}</p>
                  <p className="mt-1 text-sm font-semibold">{latestDateLabel}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weightCard.changeVsPrevious')}</p>
                  <p className={`mt-1 text-sm font-semibold ${variationTone}`}>
                    {stats.variationKg != null && stats.variationKg <= 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown size={14} />
                        {formatVariation(stats.variationKg)}
                      </span>
                    ) : stats.variationKg != null ? (
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp size={14} />
                        {formatVariation(stats.variationKg)}
                      </span>
                    ) : (
                      formatVariation(stats.variationKg)
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          <Button type="button" className="w-full gap-2" onClick={openEntryDialog}>
            <Plus size={16} />
            {t('dashboard.weightCard.recordWeight')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('dashboard.weightForm.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight-kg-input">{t('dashboard.weightForm.weightLabel')}</Label>
              <Input
                id="weight-kg-input"
                inputMode="decimal"
                placeholder={t('dashboard.weightForm.weightPlaceholder')}
                value={weightInput}
                maxLength={WEIGHT_INPUT_MAX_LENGTH}
                onChange={(event) => setWeightInput(event.target.value.slice(0, WEIGHT_INPUT_MAX_LENGTH))}
                aria-invalid={Boolean(fieldErrors.weightKg)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{fieldErrors.weightKg ?? ''}</p>
                <p className="text-xs text-muted-foreground">
                  {weightInput.length}/{WEIGHT_INPUT_MAX_LENGTH}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-date-input">{t('dashboard.weightForm.dateLabel')}</Label>
              <Input
                id="weight-date-input"
                type="date"
                value={dateInput}
                max={todayDateKey()}
                onChange={(event) => setDateInput(event.target.value)}
                aria-invalid={Boolean(fieldErrors.date)}
              />
              {fieldErrors.date ? (
                <p className="text-xs text-destructive">{fieldErrors.date}</p>
              ) : null}
            </div>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={dismissEntryFlow} disabled={registerWeight.isPending}>
              {t('dashboard.weightForm.cancel')}
            </Button>
            <Button type="button" onClick={handleReviewBeforeSave} disabled={registerWeight.isPending}>
              {t('dashboard.weightForm.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={handleBackToForm}
        onConfirm={() => {
          void handleConfirmSave();
        }}
        title={t('dashboard.weightForm.confirmTitle')}
        description={t('dashboard.weightForm.confirmDescription', {
          weight: Number(weightInput || 0).toFixed(1),
          date: formatLongDate(dateInput, i18n.language),
        })}
        confirmText={t('dashboard.weightForm.confirmAction')}
        cancelText={t('dashboard.weightForm.back')}
        icon={<Scale size={20} />}
        isLoading={registerWeight.isPending}
      />
    </>
  );
};
