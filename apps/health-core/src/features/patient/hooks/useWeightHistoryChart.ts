import { useEffect, useMemo, useRef, useState } from 'react';

import { todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import {
  aggregateWeightRecords,
  buildWeightTableRows,
  filterWeightRecordsByRange,
  getDefaultGroupingForRange,
  getPeriodWeightStats,
  getVisibleTickIndexes,
  getWeightRangeStates,
  getWeightRangeWindow,
  sortWeightRecordsAscending,
  type WeightHistoryRange,
} from '@/features/patient/utils/weightHistory';
import {
  formatLongDate,
  getChartCoordinates,
  getSummaryTranslationKey,
  getSummaryTranslationParams,
} from '@/features/patient/utils/weightHistoryPresentation';

interface UseWeightHistoryChartParams {
  records: WeightRecord[] | undefined;
  locale: string;
}

export const useWeightHistoryChart = ({
  records,
  locale,
}: UseWeightHistoryChartParams) => {
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [range, setRange] = useState<WeightHistoryRange>('30d');

  const allRecords = useMemo(() => sortWeightRecordsAscending(records), [records]);
  const referenceDate = todayDateKey();
  const rangeStates = useMemo(() => getWeightRangeStates(allRecords, referenceDate), [allRecords, referenceDate]);

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
    [allRecords, range, referenceDate],
  );
  const rangeWindow = useMemo(
    () => getWeightRangeWindow(range, allRecords, referenceDate),
    [allRecords, range, referenceDate],
  );
  const grouping = useMemo(() => getDefaultGroupingForRange(range, filteredRecords), [filteredRecords, range]);
  const chartPoints = useMemo(
    () => aggregateWeightRecords(filteredRecords, grouping, locale),
    [filteredRecords, grouping, locale],
  );
  const tableRows = useMemo(() => buildWeightTableRows(filteredRecords, locale), [filteredRecords, locale]);
  const periodStats = useMemo(() => getPeriodWeightStats(filteredRecords), [filteredRecords]);
  const chart = useMemo(
    () => (chartPoints.length > 1 ? getChartCoordinates(chartPoints, chartWidth) : null),
    [chartPoints, chartWidth],
  );
  const visibleTickIndexes = useMemo(
    () => getVisibleTickIndexes(chartPoints.length),
    [chartPoints.length],
  );

  const latestDateLabel = periodStats.latestDate
    ? formatLongDate(periodStats.latestDate, locale)
    : null;
  const summaryTranslationKey = getSummaryTranslationKey(
    range,
    filteredRecords.length,
    periodStats.periodChangeKg,
  );
  const summaryParams = getSummaryTranslationParams(
    range,
    filteredRecords.length,
    periodStats.currentWeightKg,
    periodStats.periodChangeKg,
  );

  return {
    chartHostRef,
    range,
    setRange,
    allRecords,
    filteredRecords,
    rangeStates,
    rangeWindow,
    chartPoints,
    tableRows,
    periodStats,
    chart,
    visibleTickIndexes,
    latestDateLabel,
    summaryTranslationKey,
    summaryParams,
  };
};
