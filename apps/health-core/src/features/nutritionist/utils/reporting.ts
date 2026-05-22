import type { NutritionistWeightProgressReportRowResponse } from '@/features/clinical/types/clinical.types';
import {
  getDateRangeForDateKeys,
  parseDateKey,
  todayDateKey,
  toDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import type {
  NutritionistAppointmentSummary,
  NutritionistCalendarRange,
  NutritionistReportRangeKey,
} from '@/features/nutritionist/types/report.types';
import type { AppointmentResponse } from '@/features/nutritionist/types/agenda.types';

const RANGE_MONTHS: Record<NutritionistReportRangeKey, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '12m': 12,
};

export const NUTRITIONIST_REPORT_RANGE_OPTIONS: NutritionistReportRangeKey[] = [
  '1m',
  '3m',
  '6m',
  '12m',
];

export const getCalendarMonthRange = (
  rangeKey: NutritionistReportRangeKey,
  referenceDateKey = todayDateKey()
): NutritionistCalendarRange => {
  const referenceDate = parseDateKey(referenceDateKey);
  const startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  startDate.setMonth(startDate.getMonth() - (RANGE_MONTHS[rangeKey] - 1));

  const fromDateKey = toDateKey(startDate);
  const toDateKeyValue = toDateKey(referenceDate);
  const isoRange = getDateRangeForDateKeys(fromDateKey, toDateKeyValue);

  return {
    key: rangeKey,
    fromDateKey,
    toDateKey: toDateKeyValue,
    fromIso: isoRange.from,
    toIso: isoRange.to,
  };
};

export const summarizeAppointments = (
  appointments: AppointmentResponse[]
): NutritionistAppointmentSummary => {
  const attendedCount = appointments.filter((appointment) => appointment.status === 'ATTENDED').length;
  const cancelledCount = appointments.filter((appointment) => appointment.status === 'CANCELLED').length;
  const relevantCount = attendedCount + cancelledCount;

  if (relevantCount === 0) {
    return {
      attendedCount,
      cancelledCount,
      relevantCount,
      attendedPercent: 0,
      cancelledPercent: 0,
    };
  }

  return {
    attendedCount,
    cancelledCount,
    relevantCount,
    attendedPercent: Math.round((attendedCount / relevantCount) * 100),
    cancelledPercent: Math.round((cancelledCount / relevantCount) * 100),
  };
};

export const getWeightChangeToneClassName = (netChangeKg: number | null) => {
  if (netChangeKg == null) {
    return 'text-muted-foreground';
  }

  if (netChangeKg < 0) {
    return 'text-emerald-600 dark:text-emerald-400';
  }

  if (netChangeKg > 0) {
    return 'text-amber-600 dark:text-amber-400';
  }

  return 'text-foreground';
};

export const getLatestWeightReportDate = (
  rows: NutritionistWeightProgressReportRowResponse[]
): string | null => {
  const dates = rows
    .map((row) => row.latestRecordDateInRange)
    .filter((value): value is string => Boolean(value))
    .sort();

  return dates.at(-1) ?? null;
};
