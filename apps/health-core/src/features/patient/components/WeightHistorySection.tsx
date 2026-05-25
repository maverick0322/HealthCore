import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Flag, Pencil, Scale, Trash2, TrendingDown } from 'lucide-react';

import { useDeleteWeightRecord } from '@/features/patient/hooks/useDeleteWeightRecord';
import { useEditWeightRecord } from '@/features/patient/hooks/useEditWeightRecord';
import { useWeightHistory } from '@/features/patient/hooks/useWeightHistory';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import {
  aggregateWeightRecords,
  buildWeightTableRows,
  filterWeightRecordsByRange,
  getDefaultGroupingForRange,
  getPeriodWeightStats,
  getWeightRangeWindow,
  getVisibleTickIndexes,
  getWeightRangeStates,
  getWeightValidationErrors,
  sortWeightRecordsAscending,
  type WeightChartPoint,
  type WeightHistoryRange,
  type WeightTableRow,
} from '@/features/patient/utils/weightHistory';
import { todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const RANGE_OPTIONS: WeightHistoryRange[] = ['30d', '90d', '180d', '365d', 'all'];
const WEIGHT_INPUT_MAX_LENGTH = 5;

interface ChartCoordinate extends WeightChartPoint {
  x: number;
  y: number;
}

interface ChartTooltipState {
  x: number;
  y: number;
  label: string;
  weightKg: number;
}

const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

const formatVariation = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

const formatLongDate = (date: string, locale: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const getWeightTickValues = (min: number, max: number) => {
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return [];
  }

  if (min === max) {
    return [min];
  }

  const midpoint = min + (max - min) / 2;
  return [max, midpoint, min];
};

const getSmoothPath = (points: ChartCoordinate[]) => {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const controlPoint1X = current.x + (next.x - previous.x) / 6;
    const controlPoint1Y = current.y + (next.y - previous.y) / 6;
    const controlPoint2X = next.x - (afterNext.x - current.x) / 6;
    const controlPoint2Y = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${next.x} ${next.y}`;
  }

  return path;
};

const getChartCoordinates = (points: WeightChartPoint[], width: number) => {
  const chartWidth = Math.max(width, points.length * 96, 720);
  const height = 320;
  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 56;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = points.map((point) => point.weightKg);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const paddedMin = minValue === maxValue ? minValue - 1 : minValue - 0.5;
  const paddedMax = minValue === maxValue ? maxValue + 1 : maxValue + 0.5;
  const valueRange = paddedMax - paddedMin || 1;
  const timestamps = points.map((point) => new Date(`${point.sortDate}T12:00:00`).getTime());
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const timeRange = maxTimestamp - minTimestamp || 1;

  const coordinates = points.map((point, index) => {
    const timestamp = timestamps[index];
    const x = paddingLeft + ((timestamp - minTimestamp) / timeRange) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + chartHeight - ((point.weightKg - paddedMin) / valueRange) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  return {
    width: chartWidth,
    height,
    coordinates,
    path: getSmoothPath(coordinates),
    tickValues: getWeightTickValues(paddedMin, paddedMax),
    chartBottom: height - paddingBottom,
    chartTop: paddingTop,
    chartLeft: paddingLeft,
    chartRight: chartWidth - paddingRight,
    valueRange,
    paddedMin,
  };
};

const getSummaryToneKey = (changeKg: number | null) => {
  if (changeKg == null || Math.abs(changeKg) < 0.05) {
    return 'stable';
  }

  return changeKg < 0 ? 'down' : 'up';
};

const getSummaryTranslationParams = (
  range: WeightHistoryRange,
  changeKg: number | null
) => {
  const absoluteChange = Math.abs(changeKg ?? 0).toFixed(1);

  if (range === 'all') {
    return { change: absoluteChange };
  }

  const days = range === '30d' ? 30 : range === '90d' ? 90 : range === '180d' ? 180 : 365;
  return { days, change: absoluteChange };
};

interface WeightHistorySectionProps {
  records?: WeightRecord[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  readOnly?: boolean;
}

export const WeightHistorySection = ({
  records,
  isLoading: externalIsLoading,
  isError: externalIsError,
  onRetry,
  readOnly = false,
}: Readonly<WeightHistorySectionProps> = {}) => {
  const { t, i18n } = useTranslation('patient');
  const usesExternalRecords = records !== undefined;
  const { data, isLoading, isError, refetch } = useWeightHistory({ enabled: !usesExternalRecords });
  const editWeightRecord = useEditWeightRecord();
  const deleteWeightRecord = useDeleteWeightRecord();

  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [range, setRange] = useState<WeightHistoryRange>('30d');
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WeightTableRow | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(todayDateKey());
  const [fieldErrors, setFieldErrors] = useState<{ weightKg?: string; date?: string }>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const sourceRecords = usesExternalRecords ? records : data;
  const allRecords = useMemo(() => sortWeightRecordsAscending(sourceRecords), [sourceRecords]);
  const referenceDate = todayDateKey();
  const rangeStates = useMemo(() => getWeightRangeStates(allRecords, referenceDate), [allRecords, referenceDate]);
  const resolvedIsLoading = usesExternalRecords ? Boolean(externalIsLoading) : isLoading;
  const resolvedIsError = usesExternalRecords ? Boolean(externalIsError) : isError;
  const handleRetry = usesExternalRecords ? onRetry : () => refetch();
  const canManageRecords = !readOnly && !usesExternalRecords;

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setChartWidth(nextWidth);
    });

    if (chartHostRef.current) {
      resizeObserver.observe(chartHostRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const currentRange = rangeStates.find((state) => state.range === range);
    if (currentRange?.disabled) {
      setRange('all');
    }
  }, [range, rangeStates]);

  const filteredRecords = useMemo(
    () => filterWeightRecordsByRange(allRecords, range, referenceDate),
    [allRecords, range, referenceDate]
  );
  const rangeWindow = useMemo(
    () => getWeightRangeWindow(range, allRecords, referenceDate),
    [allRecords, range, referenceDate]
  );
  const grouping = useMemo(() => getDefaultGroupingForRange(range, filteredRecords), [filteredRecords, range]);
  const chartPoints = useMemo(
    () => aggregateWeightRecords(filteredRecords, grouping, i18n.language),
    [filteredRecords, grouping, i18n.language]
  );
  const tableRows = useMemo(() => buildWeightTableRows(filteredRecords, i18n.language), [filteredRecords, i18n.language]);
  const periodStats = useMemo(() => getPeriodWeightStats(filteredRecords), [filteredRecords]);
  const chart = useMemo(
    () => (chartPoints.length > 1 ? getChartCoordinates(chartPoints, chartWidth) : null),
    [chartPoints, chartWidth]
  );
  const visibleTickIndexes = useMemo(
    () => getVisibleTickIndexes(chartPoints.length),
    [chartPoints.length]
  );

  const resetEditFlow = () => {
    setEditDialogOpen(false);
    setConfirmEditOpen(false);
    setSelectedRow(null);
    setWeightInput('');
    setDateInput(todayDateKey());
    setFieldErrors({});
    setActionError(null);
  };

  const openEditFlow = (row: WeightTableRow) => {
    setSelectedRow(row);
    setWeightInput(row.weightKg.toFixed(1));
    setDateInput(row.date);
    setFieldErrors({});
    setActionError(null);
    setDeleteConfirmOpen(false);
    setConfirmEditOpen(false);
    setEditDialogOpen(true);
  };

  const handleReviewEdit = () => {
    const validationErrors = getWeightValidationErrors(weightInput, dateInput, t);
    setFieldErrors(validationErrors);
    setActionError(null);

    if (validationErrors.weightKg || validationErrors.date) {
      return;
    }

    setEditDialogOpen(false);
    setConfirmEditOpen(true);
  };

  const handleBackToEdit = () => {
    setConfirmEditOpen(false);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!selectedRow) {
      return;
    }

    try {
      await editWeightRecord.mutateAsync({
        originalDate: selectedRow.date,
        weightKg: Number(weightInput),
        date: dateInput,
      });
      resetEditFlow();
    } catch (error: any) {
      setConfirmEditOpen(false);
      setEditDialogOpen(true);
      setActionError(error?.response?.data?.message ?? t('history.actions.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) {
      return;
    }

    try {
      await deleteWeightRecord.mutateAsync(selectedRow.date);
      setDeleteConfirmOpen(false);
      setSelectedRow(null);
      setActionError(null);
    } catch (error: any) {
      setDeleteConfirmOpen(false);
      setActionError(error?.response?.data?.message ?? t('history.actions.deleteError'));
    }
  };

  const latestDateLabel = periodStats.latestDate
    ? formatLongDate(periodStats.latestDate, i18n.language)
    : t('history.noDate');

  const summaryTone = getSummaryToneKey(periodStats.periodChangeKg);
  const summaryTranslationKey = filteredRecords.length <= 1
    ? 'history.summary.singleRecord'
    : range === 'all'
      ? `history.summary.fromStart.${summaryTone}`
      : `history.summary.range.${summaryTone}`;
  const summaryParams = filteredRecords.length <= 1
    ? { weight: periodStats.currentWeightKg?.toFixed(1) ?? '--' }
    : getSummaryTranslationParams(range, periodStats.periodChangeKg);

  return (
    <>
      <Card id="card-history-weight">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingDown size={16} className="text-primary" />
            {t('history.weightProgressTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {resolvedIsLoading ? (
            <div className="space-y-4">
              <div className="h-16 rounded-xl bg-muted animate-pulse" />
              <div className="h-80 rounded-2xl bg-muted animate-pulse" />
              <div className="h-48 rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : resolvedIsError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">{t('history.weightErrorMessage')}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => handleRetry?.()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : allRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{t('history.noWeightEntries')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarRange size={16} className="text-primary" />
                      {t('history.filtersLabel')}
                    </div>
                    <p className="max-w-3xl text-sm font-medium text-foreground">
                      {t(summaryTranslationKey, summaryParams)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('history.rangeWindow', {
                        from: formatLongDate(rangeWindow.fromDate, i18n.language),
                        to: formatLongDate(rangeWindow.toDate, i18n.language),
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {RANGE_OPTIONS.map((option) => {
                        const rangeState = rangeStates.find((state) => state.range === option);
                        const isDisabled = rangeState?.disabled ?? false;

                        return (
                          <span
                            key={option}
                            className="inline-flex"
                            title={isDisabled ? t('history.rangeDisabledHint') : undefined}
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant={range === option ? 'default' : 'outline'}
                              onClick={() => {
                                if (!isDisabled) {
                                  setRange(option);
                                }
                              }}
                              aria-disabled={isDisabled}
                              tabIndex={isDisabled ? -1 : 0}
                              className={isDisabled ? 'cursor-not-allowed opacity-50' : undefined}
                            >
                              {t(`history.ranges.${option}`)}
                            </Button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[340px]">
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <p className="text-xs text-muted-foreground">{t('history.currentWeight')}</p>
                      <p className="mt-1 text-sm font-semibold">{formatWeight(periodStats.currentWeightKg)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <p className="text-xs text-muted-foreground">{t('history.periodChange')}</p>
                      <p className="mt-1 text-sm font-semibold">{formatVariation(periodStats.periodChangeKg)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-3">
                      <p className="text-xs text-muted-foreground">{t('history.latestRecord')}</p>
                      <p className="mt-1 text-sm font-semibold">{latestDateLabel}</p>
                    </div>
                  </div>
                </div>

                {actionError ? (
                  <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {actionError}
                  </div>
                ) : null}

                <div ref={chartHostRef} className="mt-5">
                  {filteredRecords.length <= 1 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background/80 px-6 py-8 text-center">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Flag size={24} />
                      </div>
                      <p className="mt-4 text-3xl font-semibold">{formatWeight(periodStats.currentWeightKg)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('history.singleRecordHelp')}
                      </p>
                    </div>
                  ) : chart ? (
                    <div className="overflow-x-auto pb-2">
                      <div className="relative" style={{ width: `${chart.width}px` }}>
                        <svg
                          width={chart.width}
                          height={chart.height}
                          viewBox={`0 0 ${chart.width} ${chart.height}`}
                          className="w-full"
                          role="img"
                          aria-label={t('history.weightChartAriaLabel')}
                        >
                          {chart.tickValues.map((tickValue) => {
                            const y =
                              chart.chartTop +
                              (chart.height - 56 - chart.chartTop) -
                              ((tickValue - chart.paddedMin) / chart.valueRange) * (chart.height - 56 - chart.chartTop);

                            return (
                              <g key={tickValue}>
                                <line
                                  x1={chart.chartLeft}
                                  x2={chart.chartRight}
                                  y1={y}
                                  y2={y}
                                  className="stroke-border/70"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={chart.chartLeft - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  className="fill-muted-foreground text-[11px]"
                                >
                                  {`${tickValue.toFixed(1)} kg`}
                                </text>
                              </g>
                            );
                          })}

                          <path
                            d={chart.path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                          />

                          {chart.coordinates.map((point, index) => (
                            <g
                              key={`${point.bucketKey}-${point.sourceDate}`}
                              onMouseEnter={() =>
                                setTooltip({
                                  x: point.x,
                                  y: point.y,
                                  label: formatLongDate(point.sourceDate, i18n.language),
                                  weightKg: point.weightKg,
                                })
                              }
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r={index === chart.coordinates.length - 1 ? 5 : 4}
                                className={index === chart.coordinates.length - 1 ? 'fill-primary' : 'fill-primary/80'}
                              />
                              {visibleTickIndexes.has(index) ? (
                                <text
                                  x={point.x}
                                  y={chart.height - 18}
                                  textAnchor="middle"
                                  className="fill-muted-foreground text-[11px]"
                                >
                                  {point.label}
                                </text>
                              ) : null}
                            </g>
                          ))}
                        </svg>

                        {tooltip ? (
                          <div
                            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg"
                            style={{
                              left: tooltip.x,
                              top: Math.max(tooltip.y - 54, 8),
                            }}
                          >
                            <p className="font-medium">{tooltip.label}</p>
                            <p className="text-muted-foreground">{formatWeight(tooltip.weightKg)}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background">
                <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                  <Scale size={15} className="text-primary" />
                  <p className="text-sm font-semibold">{t('history.previousRecordsTitle')}</p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('history.table.date')}</TableHead>
                      <TableHead>{t('history.table.weight')}</TableHead>
                      <TableHead>{t('history.table.variation')}</TableHead>
                      {canManageRecords ? <TableHead>{t('history.table.actions')}</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell>{formatWeight(row.weightKg)}</TableCell>
                        <TableCell>{formatVariation(row.variationKg)}</TableCell>
                        {canManageRecords ? (
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => openEditFlow(row)}>
                                <Pencil size={14} />
                                {t('history.actions.edit')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRow(row);
                                  setActionError(null);
                                  setDeleteConfirmOpen(true);
                                }}
                                disabled={allRecords.length <= 1}
                                title={allRecords.length <= 1 ? t('history.actions.deleteDisabled') : undefined}
                              >
                                <Trash2 size={14} />
                                {t('history.actions.delete')}
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {canManageRecords ? (
        <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? setEditDialogOpen(true) : resetEditFlow())}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('history.editDialog.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="history-weight-kg-input">{t('dashboard.weightForm.weightLabel')}</Label>
              <Input
                id="history-weight-kg-input"
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
              <Label htmlFor="history-weight-date-input">{t('dashboard.weightForm.dateLabel')}</Label>
              <Input
                id="history-weight-date-input"
                type="date"
                value={dateInput}
                max={todayDateKey()}
                onChange={(event) => setDateInput(event.target.value)}
                aria-invalid={Boolean(fieldErrors.date)}
              />
              {fieldErrors.date ? <p className="text-xs text-destructive">{fieldErrors.date}</p> : null}
            </div>

            {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetEditFlow}
              disabled={editWeightRecord.isPending}
            >
              {t('dashboard.weightForm.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleReviewEdit}
              disabled={editWeightRecord.isPending}
            >
              {t('history.editDialog.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      ) : null}

      {canManageRecords ? (
        <ConfirmModal
        isOpen={confirmEditOpen}
        onClose={handleBackToEdit}
        onConfirm={() => {
          void handleConfirmEdit();
        }}
        title={t('history.editDialog.confirmTitle')}
        description={t('history.editDialog.confirmDescription', {
          weight: Number(weightInput || 0).toFixed(1),
          date: formatLongDate(dateInput, i18n.language),
        })}
        confirmText={t('history.editDialog.confirmAction')}
        cancelText={t('dashboard.weightForm.back')}
        icon={<Pencil size={20} />}
        isLoading={editWeightRecord.isPending}
        />
      ) : null}

      {canManageRecords ? (
        <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
        title={t('history.deleteDialog.title')}
        description={t('history.deleteDialog.description', {
          date: selectedRow ? formatLongDate(selectedRow.date, i18n.language) : t('history.noDate'),
          weight: selectedRow ? selectedRow.weightKg.toFixed(1) : '--',
        })}
        confirmText={t('history.deleteDialog.confirmAction')}
        cancelText={t('dashboard.weightForm.cancel')}
        icon={<Trash2 size={20} />}
        isLoading={deleteWeightRecord.isPending}
        isDestructive
        />
      ) : null}
    </>
  );
};
