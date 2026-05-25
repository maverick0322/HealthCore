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
  getWeightRangeStates,
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

  it('builds descending table rows from filtered records with variations', () => {
    const rows = buildWeightTableRows(SAMPLE_RECORDS, 'en');

    expect(rows[0].weightKg).toBe(78.1);
    expect(rows[0].variationKg).toBeCloseTo(-0.4, 5);
    expect(rows.at(-1)?.variationKg).toBeNull();
  });

  it('derives period stats from aggregated data', () => {
    const stats = getPeriodWeightStats(SAMPLE_RECORDS);

    expect(stats.currentWeightKg).toBe(78.1);
    expect(stats.periodChangeKg).toBeCloseTo(-3.9, 5);
    expect(stats.minWeightKg).toBe(78.1);
    expect(stats.latestDate).toBe('2026-05-18');
  });

  it('returns the recommended grouping for each range', () => {
    expect(getDefaultGroupingForRange('30d', SAMPLE_RECORDS)).toBe('day');
    expect(getDefaultGroupingForRange('90d', SAMPLE_RECORDS)).toBe('week');
    expect(getDefaultGroupingForRange('180d', SAMPLE_RECORDS)).toBe('month');
    expect(getDefaultGroupingForRange('365d', SAMPLE_RECORDS)).toBe('month');
    expect(getDefaultGroupingForRange('all', SAMPLE_RECORDS)).toBe('month');
  });

  it('returns adaptive range states based on records inside each range', () => {
    const states = getWeightRangeStates(SAMPLE_RECORDS, '2026-05-24');

    expect(states.find((state) => state.range === '30d')?.disabled).toBe(false);
    expect(states.find((state) => state.range === '90d')?.disabled).toBe(false);
    expect(states.find((state) => state.range === '180d')?.disabled).toBe(false);
    expect(states.find((state) => state.range === '365d')?.disabled).toBe(false);
    expect(states.find((state) => state.range === 'all')?.disabled).toBe(false);
  });

  it('disables a range when there are no records inside that window even if there is older history', () => {
    const states = getWeightRangeStates(
      [
        { weightKg: 90.0, date: '2025-09-21' },
        { weightKg: 89.0, date: '2025-09-28' },
      ],
      '2026-05-24'
    );

    expect(states.find((state) => state.range === '30d')?.disabled).toBe(true);
    expect(states.find((state) => state.range === '90d')?.disabled).toBe(true);
    expect(states.find((state) => state.range === '180d')?.disabled).toBe(true);
    expect(states.find((state) => state.range === '365d')?.disabled).toBe(false);
    expect(states.find((state) => state.range === 'all')?.disabled).toBe(false);
  });

  it('limits visible tick labels for dense datasets', () => {
    const ticks = getVisibleTickIndexes(12);

    expect(ticks.has(0)).toBe(true);
    expect(ticks.has(11)).toBe(true);
    expect(ticks.size).toBeLessThan(12);
  });
});
