import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Scale, TrendingDown } from 'lucide-react';

import { useWeightHistory } from '@/features/patient/hooks/useWeightHistory';
import {
  aggregateWeightRecords,
  buildWeightTableRows,
  filterWeightRecordsByRange,
  getDefaultGroupingForRange,
  getPeriodWeightStats,
  getVisibleTickIndexes,
  type WeightChartPoint,
  type WeightHistoryGrouping,
  type WeightHistoryRange,
} from '@/features/patient/utils/weightHistory';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const RANGE_OPTIONS: WeightHistoryRange[] = ['30d', '3m', '1y', 'all'];
const GROUPING_OPTIONS: WeightHistoryGrouping[] = ['day', 'week', 'month', 'year'];

const getChartCoordinates = (points: WeightChartPoint[]) => {
  const width = Math.max(560, points.length * 92);
  const height = 240;
  const paddingLeft = 24;
  const paddingTop = 20;
  const paddingBottom = 44;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = points.map((point) => point.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = max - min || 1;

  const coordinates = points.map((point, index) => {
    const x = paddingLeft + (index * (width - paddingLeft * 2)) / Math.max(points.length - 1, 1);
    const y = paddingTop + chartHeight - ((point.weightKg - min) / yRange) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  return {
    width,
    height,
    min,
    max,
    coordinates,
    linePath: coordinates.map((point) => `${point.x},${point.y}`).join(' '),
  };
};

const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

const formatVariation = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

export const WeightHistorySection = () => {
  const { t, i18n } = useTranslation('patient');
  const { data, isLoading, isError, refetch } = useWeightHistory();

  const [range, setRange] = useState<WeightHistoryRange>('30d');
  const [grouping, setGrouping] = useState<WeightHistoryGrouping>(getDefaultGroupingForRange('30d'));

  const filteredRecords = useMemo(() => filterWeightRecordsByRange(data, range), [data, range]);
  const chartPoints = useMemo(
    () => aggregateWeightRecords(filteredRecords, grouping, i18n.language),
    [filteredRecords, grouping, i18n.language]
  );
  const tableRows = useMemo(() => buildWeightTableRows(chartPoints), [chartPoints]);
  const periodStats = useMemo(() => getPeriodWeightStats(chartPoints), [chartPoints]);
  const chart = useMemo(() => (chartPoints.length > 0 ? getChartCoordinates(chartPoints) : null), [chartPoints]);
  const visibleTickIndexes = useMemo(
    () => getVisibleTickIndexes(chartPoints.length),
    [chartPoints.length]
  );

  const latestDateLabel = periodStats.latestDate
    ? new Date(`${periodStats.latestDate}T12:00:00`).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : t('history.noDate');

  const handleRangeChange = (nextRange: WeightHistoryRange) => {
    setRange(nextRange);
    setGrouping(getDefaultGroupingForRange(nextRange));
  };

  return (
    <Card id="card-history-weight">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingDown size={16} className="text-primary" />
          {t('history.weightEvolution')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <p className="text-destructive">{t('history.weightErrorMessage')}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : chartPoints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">{t('history.noWeightEntries')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('history.currentWeight')}</p>
                <p className="mt-1 text-sm font-semibold">{formatWeight(periodStats.currentWeightKg)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('history.periodChange')}</p>
                <p className="mt-1 text-sm font-semibold">{formatVariation(periodStats.periodChangeKg)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('history.minWeight')}</p>
                <p className="mt-1 text-sm font-semibold">{formatWeight(periodStats.minWeightKg)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background p-3">
                <p className="text-xs text-muted-foreground">{t('history.latestRecord')}</p>
                <p className="mt-1 text-sm font-semibold">{latestDateLabel}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarRange size={16} className="text-primary" />
                  {t('history.filtersLabel')}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('history.periodLabel')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RANGE_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={range === option ? 'default' : 'outline'}
                        onClick={() => handleRangeChange(option)}
                      >
                        {t(`history.ranges.${option}`)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('history.groupByLabel')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {GROUPING_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={grouping === option ? 'secondary' : 'ghost'}
                      onClick={() => setGrouping(option)}
                    >
                      {t(`history.groupings.${option}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {chart ? (
                <div className="overflow-x-auto pb-2">
                  <svg
                    width={chart.width}
                    height={chart.height}
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    className="min-w-full"
                    role="img"
                    aria-label={t('history.weightChartAriaLabel')}
                  >
                    <defs>
                      <linearGradient id="weight-history-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    <line
                      x1="24"
                      x2={chart.width - 24}
                      y1={chart.height - 44}
                      y2={chart.height - 44}
                      className="stroke-border"
                      strokeWidth="1"
                    />

                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                      points={chart.linePath}
                    />

                    {chart.coordinates.map((point, index) => (
                      <g key={`${point.bucketKey}-${point.sourceDate}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={4.5}
                          className={index === chart.coordinates.length - 1 ? 'fill-primary' : 'fill-primary/70'}
                        >
                          <title>{`${point.label}: ${point.weightKg.toFixed(1)} kg`}</title>
                        </circle>
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
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/70 bg-background">
              <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                <Scale size={15} className="text-primary" />
                <p className="text-sm font-semibold">{t('history.weightTableTitle')}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('history.table.date')}</TableHead>
                    <TableHead>{t('history.table.weight')}</TableHead>
                    <TableHead>{t('history.table.variation')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={`${row.bucketKey}-${row.sourceDate}`}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>{formatWeight(row.weightKg)}</TableCell>
                      <TableCell>{formatVariation(row.variationKg)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
