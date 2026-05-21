import { describe, expect, it } from 'vitest';

import type { WeightRecord } from '@/features/clinical/types/clinical.types';

import {
  aggregateWeightRecords,
  buildWeightTableRows,
  filterWeightRecordsByRange,
  getDashboardWeightStats,
  getDefaultGroupingForRange,
  getLatestWeightRecords,
  getPeriodWeightStats,
  getVisibleTickIndexes,
} from './weightHistory';

const SAMPLE_RECORDS: WeightRecord[] = [
  { weightKg: 82.0, date: '2026-01-03' },
  { weightKg: 81.5, date: '2026-02-10' },
  { weightKg: 80.8, date: '2026-03-14' },
  { weightKg: 80.2, date: '2026-03-29' },
  { weightKg: 79.7, date: '2026-04-11' },
  { weightKg: 79.3, date: '2026-04-27' },
  { weightKg: 78.9, date: '2026-05-03' },
  { weightKg: 78.5, date: '2026-05-12' },
  { weightKg: 78.1, date: '2026-05-18' },
];

describe('weightHistory utils', () => {
  it('returns the latest seven records ordered by date', () => {
    const result = getLatestWeightRecords(SAMPLE_RECORDS, 7);

    expect(result).toHaveLength(7);
    expect(result[0].date).toBe('2026-03-14');
    expect(result[6].date).toBe('2026-05-18');
  });

  it('computes dashboard stats from the latest records', () => {
    const result = getDashboardWeightStats(getLatestWeightRecords(SAMPLE_RECORDS, 7));

    expect(result.latestWeightKg).toBe(78.1);
    expect(result.previousWeightKg).toBe(78.5);
    expect(result.variationKg).toBeCloseTo(-0.4, 5);
    expect(result.latestDate).toBe('2026-05-18');
  });

  it('filters records by a 30 day range', () => {
    const result = filterWeightRecordsByRange(SAMPLE_RECORDS, '30d', '2026-05-20');

    expect(result.map((record) => record.date)).toEqual(['2026-04-27', '2026-05-03', '2026-05-12', '2026-05-18']);
  });

  it('aggregates records by month using the last value in each bucket', () => {
    const result = aggregateWeightRecords(SAMPLE_RECORDS, 'month', 'en');

    expect(result).toHaveLength(5);
    expect(result[2].weightKg).toBe(80.2);
    expect(result[4].weightKg).toBe(78.1);
  });

  it('builds descending table rows with variations', () => {
    const points = aggregateWeightRecords(SAMPLE_RECORDS, 'month', 'en');
    const rows = buildWeightTableRows(points);

    expect(rows[0].weightKg).toBe(78.1);
    expect(rows[0].variationKg).toBeCloseTo(-1.2, 5);
    expect(rows.at(-1)?.variationKg).toBeNull();
  });

  it('derives period stats from aggregated data', () => {
    const points = aggregateWeightRecords(SAMPLE_RECORDS, 'month', 'en');
    const stats = getPeriodWeightStats(points);

    expect(stats.currentWeightKg).toBe(78.1);
    expect(stats.periodChangeKg).toBeCloseTo(-3.9, 5);
    expect(stats.minWeightKg).toBe(78.1);
    expect(stats.latestDate).toBe('2026-05-18');
  });

  it('returns the recommended grouping for each range', () => {
    expect(getDefaultGroupingForRange('30d')).toBe('day');
    expect(getDefaultGroupingForRange('3m')).toBe('week');
    expect(getDefaultGroupingForRange('1y')).toBe('month');
    expect(getDefaultGroupingForRange('all')).toBe('year');
  });

  it('limits visible tick labels for dense datasets', () => {
    const ticks = getVisibleTickIndexes(12);

    expect(ticks.has(0)).toBe(true);
    expect(ticks.has(11)).toBe(true);
    expect(ticks.size).toBeLessThan(12);
  });
});
