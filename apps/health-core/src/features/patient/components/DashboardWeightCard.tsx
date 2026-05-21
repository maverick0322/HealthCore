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

const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

const formatVariation = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

const getSparklinePoints = (values: number[]) => {
  if (values.length === 0) {
    return '';
  }

  const width = 280;
  const height = 96;
  const paddingX = 16;
  const paddingY = 12;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = max - min || 1;

  return values
    .map((value, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / Math.max(values.length - 1, 1);
      const y = height - paddingY - ((value - min) / yRange) * (height - paddingY * 2);
      return `${x},${y}`;
    })
    .join(' ');
};

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
  const sparklinePoints = useMemo(
    () => getSparklinePoints(latestRecords.map((record) => record.weightKg)),
    [latestRecords]
  );

  const resetDialog = () => {
    setWeightInput('');
    setDateInput(todayDateKey());
    setFieldErrors({});
    setSubmitError(null);
    setConfirmOpen(false);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const handleReviewBeforeSave = () => {
    const validationErrors = getWeightValidationErrors(weightInput, dateInput, t);
    setFieldErrors(validationErrors);
    setSubmitError(null);

    if (validationErrors.weightKg || validationErrors.date) {
      return;
    }

    setConfirmOpen(true);
  };

  const handleBackToForm = () => {
    setConfirmOpen(false);
  };

  const handleConfirmSave = async () => {
    try {
      await registerWeight.mutateAsync({
        weightKg: Number(weightInput),
        date: dateInput,
      });
      closeDialog(false);
    } catch (error: any) {
      setConfirmOpen(false);
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

                <svg viewBox="0 0 280 96" className="h-28 w-full overflow-visible">
                  <defs>
                    <linearGradient id="weight-sparkline-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                    points={sparklinePoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {latestRecords.map((record, index) => {
                    const values = latestRecords.map((entry) => entry.weightKg);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const yRange = max - min || 1;
                    const x = 16 + (index * (280 - 32)) / Math.max(latestRecords.length - 1, 1);
                    const y = 96 - 12 - ((record.weightKg - min) / yRange) * (96 - 24);

                    return (
                      <circle
                        key={record.date}
                        cx={x}
                        cy={y}
                        r={index === latestRecords.length - 1 ? 4.5 : 3.5}
                        className={index === latestRecords.length - 1 ? 'fill-primary' : 'fill-primary/60'}
                      >
                        <title>{`${record.date}: ${record.weightKg.toFixed(1)} kg`}</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weightCard.latestWeight')}</p>
                  <p className="mt-1 text-sm font-semibold">{formatWeight(stats.latestWeightKg)}</p>
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
                <div className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('dashboard.weightCard.lastRecord')}</p>
                  <p className="mt-1 text-sm font-semibold">{latestDateLabel}</p>
                </div>
              </div>
            </>
          )}

          <Button type="button" className="w-full gap-2" onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            {t('dashboard.weightCard.recordWeight')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
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
                onChange={(event) => setWeightInput(event.target.value)}
                aria-invalid={Boolean(fieldErrors.weightKg)}
              />
              {fieldErrors.weightKg ? (
                <p className="text-xs text-destructive">{fieldErrors.weightKg}</p>
              ) : null}
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
            <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={registerWeight.isPending}>
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
          date: dateInput,
        })}
        confirmText={t('dashboard.weightForm.confirmAction')}
        cancelText={t('dashboard.weightForm.back')}
        icon={<Scale size={20} />}
        isLoading={registerWeight.isPending}
      />
    </>
  );
};
