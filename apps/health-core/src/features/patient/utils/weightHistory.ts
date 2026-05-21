import type { TFunction } from 'i18next';

import { addDays, parseDateKey, startOfWeek, todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';

export type WeightHistoryRange = '30d' | '3m' | '1y' | 'all';
export type WeightHistoryGrouping = 'day' | 'week' | 'month' | 'year';

export interface WeightChartPoint {
  bucketKey: string;
  label: string;
  sortDate: string;
  sourceDate: string;
  weightKg: number;
}

export interface WeightTableRow extends WeightChartPoint {
  variationKg: number | null;
}

export interface DashboardWeightStats {
  latestWeightKg: number | null;
  previousWeightKg: number | null;
  variationKg: number | null;
  latestDate: string | null;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEIGHT_INPUT_PATTERN = /^\d{1,3}(?:\.\d)?$/;

const formatDateLabel = (dateKey: string, options: Intl.DateTimeFormatOptions, locale = 'en') =>
  parseDateKey(dateKey).toLocaleDateString(locale, options);

const monthKeyFromDate = (dateKey: string) => dateKey.slice(0, 7);
const yearKeyFromDate = (dateKey: string) => dateKey.slice(0, 4);

const shiftMonths = (dateKey: string, months: number) => {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + months);
  return date;
};

export const isValidDateKey = (value: string) => {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const parsedDate = parseDateKey(value);
  return !Number.isNaN(parsedDate.getTime());
};

export const sortWeightRecordsAscending = (records: WeightRecord[] | undefined | null): WeightRecord[] =>
  [...(records ?? [])].sort((left, right) => left.date.localeCompare(right.date));

export const getLatestWeightRecords = (records: WeightRecord[] | undefined | null, limit = 7): WeightRecord[] => {
  const sortedRecords = sortWeightRecordsAscending(records);
  return sortedRecords.slice(Math.max(0, sortedRecords.length - limit));
};

export const getDashboardWeightStats = (records: WeightRecord[] | undefined | null): DashboardWeightStats => {
  const sortedRecords = sortWeightRecordsAscending(records);
  if (sortedRecords.length === 0) {
    return {
      latestWeightKg: null,
      previousWeightKg: null,
      variationKg: null,
      latestDate: null,
    };
  }

  const latestRecord = sortedRecords[sortedRecords.length - 1];
  const previousRecord = sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2] : null;

  return {
    latestWeightKg: latestRecord.weightKg,
    previousWeightKg: previousRecord?.weightKg ?? null,
    variationKg: previousRecord ? latestRecord.weightKg - previousRecord.weightKg : null,
    latestDate: latestRecord.date,
  };
};

export const getDefaultGroupingForRange = (range: WeightHistoryRange): WeightHistoryGrouping => {
  switch (range) {
    case '30d':
      return 'day';
    case '3m':
      return 'week';
    case '1y':
      return 'month';
    case 'all':
    default:
      return 'year';
  }
};

export const filterWeightRecordsByRange = (
  records: WeightRecord[] | undefined | null,
  range: WeightHistoryRange,
  referenceDate: string = todayDateKey()
): WeightRecord[] => {
  const sortedRecords = sortWeightRecordsAscending(records);
  if (range === 'all') {
    return sortedRecords;
  }

  const reference = parseDateKey(referenceDate);
  let fromDate = parseDateKey(referenceDate);

  switch (range) {
    case '30d':
      fromDate.setDate(reference.getDate() - 29);
      break;
    case '3m':
      fromDate = shiftMonths(referenceDate, -3);
      fromDate.setDate(fromDate.getDate() + 1);
      break;
    case '1y':
      fromDate = shiftMonths(referenceDate, -12);
      fromDate.setDate(fromDate.getDate() + 1);
      break;
    default:
      break;
  }

  const fromDateKey = [
    fromDate.getFullYear(),
    String(fromDate.getMonth() + 1).padStart(2, '0'),
    String(fromDate.getDate()).padStart(2, '0'),
  ].join('-');

  return sortedRecords.filter((record) => record.date >= fromDateKey && record.date <= referenceDate);
};

const getBucketKey = (dateKey: string, grouping: WeightHistoryGrouping) => {
  switch (grouping) {
    case 'week':
      return startOfWeek(dateKey);
    case 'month':
      return monthKeyFromDate(dateKey);
    case 'year':
      return yearKeyFromDate(dateKey);
    case 'day':
    default:
      return dateKey;
  }
};

const getBucketSortDate = (bucketKey: string, grouping: WeightHistoryGrouping) => {
  switch (grouping) {
    case 'month':
      return `${bucketKey}-01`;
    case 'year':
      return `${bucketKey}-01-01`;
    case 'week':
    case 'day':
    default:
      return bucketKey;
  }
};

const getBucketLabel = (bucketKey: string, grouping: WeightHistoryGrouping, locale = 'en') => {
  switch (grouping) {
    case 'day':
      return formatDateLabel(bucketKey, { month: 'short', day: 'numeric' }, locale);
    case 'week': {
      const weekStart = bucketKey;
      const weekEnd = addDays(bucketKey, 6);
      return `${formatDateLabel(weekStart, { month: 'short', day: 'numeric' }, locale)} - ${formatDateLabel(weekEnd, { month: 'short', day: 'numeric' }, locale)}`;
    }
    case 'month':
      return parseDateKey(`${bucketKey}-01`).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    case 'year':
      return bucketKey;
    default:
      return bucketKey;
  }
};

export const aggregateWeightRecords = (
  records: WeightRecord[] | undefined | null,
  grouping: WeightHistoryGrouping,
  locale = 'en'
): WeightChartPoint[] => {
  const grouped = new Map<string, WeightChartPoint>();

  sortWeightRecordsAscending(records).forEach((record) => {
    const bucketKey = getBucketKey(record.date, grouping);
    grouped.set(bucketKey, {
      bucketKey,
      label: getBucketLabel(bucketKey, grouping, locale),
      sortDate: getBucketSortDate(bucketKey, grouping),
      sourceDate: record.date,
      weightKg: record.weightKg,
    });
  });

  return [...grouped.values()].sort((left, right) => left.sortDate.localeCompare(right.sortDate));
};

export const buildWeightTableRows = (points: WeightChartPoint[]): WeightTableRow[] => {
  const rowsAscending = points.map((point, index) => ({
    ...point,
    variationKg: index === 0 ? null : point.weightKg - points[index - 1].weightKg,
  }));

  return [...rowsAscending].reverse();
};

export const getPeriodWeightStats = (points: WeightChartPoint[]) => {
  if (points.length === 0) {
    return {
      currentWeightKg: null,
      periodChangeKg: null,
      minWeightKg: null,
      latestDate: null,
    };
  }

  const firstPoint = points[0];
  const latestPoint = points[points.length - 1];

  return {
    currentWeightKg: latestPoint.weightKg,
    periodChangeKg: latestPoint.weightKg - firstPoint.weightKg,
    minWeightKg: Math.min(...points.map((point) => point.weightKg)),
    latestDate: latestPoint.sourceDate,
  };
};

export const getVisibleTickIndexes = (count: number) => {
  if (count <= 6) {
    return new Set(Array.from({ length: count }, (_, index) => index));
  }

  const targetTicks = 5;
  const step = Math.ceil((count - 1) / (targetTicks - 1));
  const indexes = new Set<number>([0, count - 1]);

  for (let index = step; index < count - 1; index += step) {
    indexes.add(index);
  }

  return indexes;
};

export const getWeightValidationErrors = (
  weightKg: string,
  date: string,
  t: TFunction
) => {
  const errors: { weightKg?: string; date?: string } = {};
  const normalizedWeight = weightKg.trim();

  if (!normalizedWeight) {
    errors.weightKg = t('dashboard.weightForm.validation.weightRequired');
  } else if (!WEIGHT_INPUT_PATTERN.test(normalizedWeight)) {
    errors.weightKg = t('dashboard.weightForm.validation.weightPrecision');
  } else {
    const parsedWeight = Number(normalizedWeight);
    if (Number.isNaN(parsedWeight)) {
      errors.weightKg = t('dashboard.weightForm.validation.weightInvalid');
    } else if (parsedWeight < 40 || parsedWeight > 200) {
      errors.weightKg = t('dashboard.weightForm.validation.weightRange');
    }
  }

  if (!date) {
    errors.date = t('dashboard.weightForm.validation.dateRequired');
  } else if (!isValidDateKey(date)) {
    errors.date = t('dashboard.weightForm.validation.dateInvalid');
  } else if (date > todayDateKey()) {
    errors.date = t('dashboard.weightForm.validation.dateFuture');
  }

  return errors;
};
