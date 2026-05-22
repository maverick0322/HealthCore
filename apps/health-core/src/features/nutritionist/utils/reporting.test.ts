import { describe, expect, it } from 'vitest';

import {
  getCalendarMonthRange,
  getLatestWeightReportDate,
  getWeightChangeToneClassName,
  summarizeAppointments,
} from './reporting';

describe('reporting utilities', () => {
  it('builds calendar month ranges from the first day of the month', () => {
    const range = getCalendarMonthRange('3m', '2026-05-22');

    expect(range.fromDateKey).toBe('2026-03-01');
    expect(range.toDateKey).toBe('2026-05-22');
    expect(range.fromIso).toContain('2026-03-01');
  });

  it('summarizes attended and cancelled appointments only', () => {
    const summary = summarizeAppointments([
      { id: '1', slotId: 's1', nutritionistId: 'n1', patientId: 'p1', startTime: '', endTime: '', status: 'ATTENDED', version: 1 },
      { id: '2', slotId: 's2', nutritionistId: 'n1', patientId: 'p2', startTime: '', endTime: '', status: 'CANCELLED', version: 1 },
      { id: '3', slotId: 's3', nutritionistId: 'n1', patientId: 'p3', startTime: '', endTime: '', status: 'PENDING', version: 1 },
    ]);

    expect(summary.attendedCount).toBe(1);
    expect(summary.cancelledCount).toBe(1);
    expect(summary.relevantCount).toBe(2);
    expect(summary.attendedPercent).toBe(50);
    expect(summary.cancelledPercent).toBe(50);
  });

  it('resolves latest weight report date and tone', () => {
    expect(
      getLatestWeightReportDate([
        {
          patientId: 'p1',
          fullName: 'Ana',
          latestRecordDateInRange: '2026-05-10',
          startWeightKg: 70,
          currentWeightKg: 68,
          netChangeKg: -2,
          hasRecordsInRange: true,
        },
        {
          patientId: 'p2',
          fullName: 'Luis',
          latestRecordDateInRange: '2026-05-21',
          startWeightKg: 90,
          currentWeightKg: 90,
          netChangeKg: 0,
          hasRecordsInRange: true,
        },
      ])
    ).toBe('2026-05-21');
    expect(getWeightChangeToneClassName(-1.5)).toContain('emerald');
    expect(getWeightChangeToneClassName(2)).toContain('amber');
    expect(getWeightChangeToneClassName(null)).toContain('muted');
  });
});
