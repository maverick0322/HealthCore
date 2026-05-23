import type { TFunction } from 'i18next';

import { addDays, parseDateKey, startOfWeek, todayDateKey } from '@/features/agenda/utils/agendaDateUtils';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';

export type WeightHistoryRange = '30d' | '90d' | '180d' | '365d' | 'all';
export type WeightHistoryGrouping = 'day' | 'week' | 'month' | 'year';

export interface WeightChartPoint {
  bucketKey: string;
  label: string;
  sortDate: string;
  sourceDate: string;
  weightKg: number;
}

export interface WeightTableRow {
  date: string;
  label: string;
  weightKg: number;
  variationKg: number | null;
}

export interface DashboardWeightStats {
  latestWeightKg: number | null;
  previousWeightKg: number | null;
  variationKg: number | null;
  latestDate: string | null;
}

export interface WeightPeriodStats {
  currentWeightKg: number | null;
  periodChangeKg: number | null;
  minWeightKg: number | null;
  latestDate: string | null;
  firstWeightKg: number | null;
  firstDate: string | null;
}

export interface WeightRangeState {
  range: WeightHistoryRange;
  disabled: boolean;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEIGHT_INPUT_PATTERN = /^\d{1,3}(?:\.\d)?$/;
const RANGE_DAY_MAP: Record<Exclude<WeightHistoryRange, 'all'>, number> = {
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
};

const formatDateLabel = (dateKey: string, options: Intl.DateTimeFormatOptions, locale = 'en') =>
  parseDateKey(dateKey).toLocaleDateString(locale, options);

const monthKeyFromDate = (dateKey: string) => dateKey.slice(0, 7);
const yearKeyFromDate = (dateKey: string) => dateKey.slice(0, 4);

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

export const getWeightHistorySpanDays = (records: WeightRecord[] | undefined | null) => {
  const sortedRecords = sortWeightRecordsAscending(records);
  if (sortedRecords.length <= 1) {
    return sortedRecords.length === 1 ? 1 : 0;
  }

  const firstDate = parseDateKey(sortedRecords[0].date).getTime();
  const lastDate = parseDateKey(sortedRecords[sortedRecords.length - 1].date).getTime();
  return Math.floor((lastDate - firstDate) / 86_400_000) + 1;
};

export const isWeightRangeAvailable = (
  records: WeightRecord[] | undefined | null,
  range: WeightHistoryRange
) => {
  const sortedRecords = sortWeightRecordsAscending(records);
  if (sortedRecords.length === 0) {
    return false;
  }
  if (range === 'all' || range === '30d') {
    return true;
  }

  return getWeightHistorySpanDays(sortedRecords) >= RANGE_DAY_MAP[range];
};

export const getWeightRangeStates = (
  records: WeightRecord[] | undefined | null
): WeightRangeState[] => ([
  { range: '30d', disabled: !isWeightRangeAvailable(records, '30d') },
  { range: '90d', disabled: !isWeightRangeAvailable(records, '90d') },
  { range: '180d', disabled: !isWeightRangeAvailable(records, '180d') },
  { range: '365d', disabled: !isWeightRangeAvailable(records, '365d') },
  { range: 'all', disabled: !isWeightRangeAvailable(records, 'all') },
]);

export const getDefaultGroupingForRange = (
  range: WeightHistoryRange,
  records?: WeightRecord[] | undefined | null
): WeightHistoryGrouping => {
  const spanDays = getWeightHistorySpanDays(records);

  switch (range) {
    case '30d':
      return 'day';
    case '90d':
      return 'week';
    case '180d':
    case '365d':
      return 'month';
    case 'all':
    default:
      if (spanDays <= 45) {
        return 'day';
      }
      if (spanDays <= 120) {
        return 'week';
      }
      if (spanDays <= 730) {
        return 'month';
      }
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
  const fromDate = parseDateKey(referenceDate);
  fromDate.setDate(reference.getDate() - (RANGE_DAY_MAP[range] - 1));

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
      return parseDateKey(`${bucketKey}-01`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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

export const buildWeightTableRows = (
  records: WeightRecord[] | undefined | null,
  locale = 'en'
): WeightTableRow[] => {
  const sortedRecords = sortWeightRecordsAscending(records);
  const rowsAscending = sortedRecords.map((record, index) => ({
    date: record.date,
    label: formatDateLabel(record.date, { day: 'numeric', month: 'long', year: 'numeric' }, locale),
    weightKg: record.weightKg,
    variationKg: index === 0 ? null : record.weightKg - sortedRecords[index - 1].weightKg,
  }));

  return [...rowsAscending].reverse();
};

export const getPeriodWeightStats = (records: WeightRecord[] | undefined | null): WeightPeriodStats => {
  const sortedRecords = sortWeightRecordsAscending(records);
  if (sortedRecords.length === 0) {
    return {
      currentWeightKg: null,
      periodChangeKg: null,
      minWeightKg: null,
      latestDate: null,
      firstWeightKg: null,
      firstDate: null,
    };
  }

  const firstRecord = sortedRecords[0];
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  return {
    currentWeightKg: latestRecord.weightKg,
    periodChangeKg: latestRecord.weightKg - firstRecord.weightKg,
    minWeightKg: Math.min(...sortedRecords.map((record) => record.weightKg)),
    latestDate: latestRecord.date,
    firstWeightKg: firstRecord.weightKg,
    firstDate: firstRecord.date,
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
