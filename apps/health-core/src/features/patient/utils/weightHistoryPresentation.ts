import type {
  WeightChartPoint,
  WeightHistoryRange,
} from '@/features/patient/utils/weightHistory';

export interface ChartCoordinate extends WeightChartPoint {
  x: number;
  y: number;
}

export interface WeightChartLayout {
  width: number;
  height: number;
  coordinates: ChartCoordinate[];
  path: string;
  tickValues: number[];
  chartBottom: number;
  chartTop: number;
  chartLeft: number;
  chartRight: number;
  valueRange: number;
  paddedMin: number;
}

export interface ChartTooltipState {
  x: number;
  y: number;
  label: string;
  weightKg: number;
}

export const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

export const formatVariation = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

export const formatLongDate = (date: string, locale: string) =>
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

export const getChartCoordinates = (points: WeightChartPoint[], width: number): WeightChartLayout => {
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

export const getSummaryTranslationKey = (
  range: WeightHistoryRange,
  filteredRecordsLength: number,
  periodChangeKg: number | null,
) => {
  if (filteredRecordsLength <= 1) {
    return 'history.summary.singleRecord';
  }

  const summaryTone = getSummaryToneKey(periodChangeKg);
  return range === 'all'
    ? `history.summary.fromStart.${summaryTone}`
    : `history.summary.range.${summaryTone}`;
};

export const getSummaryTranslationParams = (
  range: WeightHistoryRange,
  filteredRecordsLength: number,
  currentWeightKg: number | null,
  changeKg: number | null,
): Record<string, string | number> => {
  if (filteredRecordsLength <= 1) {
    return { weight: currentWeightKg?.toFixed(1) ?? '--' };
  }

  const absoluteChange = Math.abs(changeKg ?? 0).toFixed(1);
  if (range === 'all') {
    return { change: absoluteChange };
  }

  const days = range === '30d' ? 30 : range === '90d' ? 90 : range === '180d' ? 180 : 365;
  return { days, change: absoluteChange };
};
