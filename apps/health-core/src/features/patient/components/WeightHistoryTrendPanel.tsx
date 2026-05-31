import { type MutableRefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Flag } from 'lucide-react';

import type { WeightChartLayout, ChartTooltipState } from '@/features/patient/utils/weightHistoryPresentation';
import { formatLongDate, formatWeight, formatVariation } from '@/features/patient/utils/weightHistoryPresentation';
import type { WeightHistoryRange, WeightRangeState } from '@/features/patient/utils/weightHistory';
import type { WeightPeriodStats } from '@/features/patient/utils/weightHistory';
import { Button } from '@/shared/ui/button';

const RANGE_OPTIONS: WeightHistoryRange[] = ['30d', '90d', '180d', '365d', 'all'];

interface WeightHistoryTrendPanelProps {
  locale: string;
  range: WeightHistoryRange;
  rangeStates: WeightRangeState[];
  rangeWindow: { fromDate: string; toDate: string };
  filteredRecordsLength: number;
  periodStats: WeightPeriodStats;
  latestDateLabel: string | null;
  summaryTranslationKey: string;
  summaryParams: Record<string, string | number>;
  actionError: string | null;
  chartHostRef: MutableRefObject<HTMLDivElement | null>;
  chart: WeightChartLayout | null;
  visibleTickIndexes: Set<number>;
  onRangeChange: (range: WeightHistoryRange) => void;
}

export function WeightHistoryTrendPanel({
  locale,
  range,
  rangeStates,
  rangeWindow,
  filteredRecordsLength,
  periodStats,
  latestDateLabel,
  summaryTranslationKey,
  summaryParams,
  actionError,
  chartHostRef,
  chart,
  visibleTickIndexes,
  onRangeChange,
}: Readonly<WeightHistoryTrendPanelProps>) {
  const { t } = useTranslation('patient');
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);

  return (
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
              from: formatLongDate(rangeWindow.fromDate, locale),
              to: formatLongDate(rangeWindow.toDate, locale),
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
                        onRangeChange(option);
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
            <p className="mt-1 text-sm font-semibold">{latestDateLabel ?? t('history.noDate')}</p>
          </div>
        </div>
      </div>

      {actionError ? (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div ref={chartHostRef} className="mt-5">
        {filteredRecordsLength <= 1 ? (
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
                        label: formatLongDate(point.sourceDate, locale),
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
  );
}
