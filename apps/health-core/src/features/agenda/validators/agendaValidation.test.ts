import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  validateDuration,
  validateTimeBlock,
  validateNoOverlap,
  validateNotPastToday,
} from './agendaValidation';

// ── validateDuration ──────────────────────────────────────────────────────────

describe('validateDuration', () => {
  it('returns null for 15 minutes (minimum)', () => {
    expect(validateDuration(15)).toBeNull();
  });

  it('returns null for 45 minutes (common case)', () => {
    expect(validateDuration(45)).toBeNull();
  });

  it('returns null for 120 minutes (maximum)', () => {
    expect(validateDuration(120)).toBeNull();
  });

  it('returns durationTooShort for 14 minutes', () => {
    expect(validateDuration(14)).toBe('agenda.validation.durationTooShort');
  });

  it('returns durationTooLong for 121 minutes', () => {
    expect(validateDuration(121)).toBe('agenda.validation.durationTooLong');
  });

  it('returns durationNotInteger for a decimal', () => {
    expect(validateDuration(30.5)).toBe('agenda.validation.durationNotInteger');
  });
});

// ── validateTimeBlock ─────────────────────────────────────────────────────────

describe('validateTimeBlock', () => {
  it('returns null for valid block within allowed hours', () => {
    expect(validateTimeBlock('09:00', '13:00')).toBeNull();
  });

  it('returns timeBlockRequired if startTime is empty', () => {
    expect(validateTimeBlock('', '13:00')).toBe('agenda.validation.timeBlockRequired');
  });

  it('returns timeBlockRequired if endTime is empty', () => {
    expect(validateTimeBlock('09:00', '')).toBe('agenda.validation.timeBlockRequired');
  });

  it('returns timeBlockOrder when start equals end', () => {
    expect(validateTimeBlock('09:00', '09:00')).toBe('agenda.validation.timeBlockOrder');
  });

  it('returns timeBlockOrder when start is after end', () => {
    expect(validateTimeBlock('14:00', '09:00')).toBe('agenda.validation.timeBlockOrder');
  });

  it('returns timeBlockOutsideHours when start is before 06:00', () => {
    expect(validateTimeBlock('05:00', '09:00')).toBe('agenda.validation.timeBlockOutsideHours');
  });

  it('returns timeBlockOutsideHours when end is after 21:00', () => {
    expect(validateTimeBlock('20:00', '22:00')).toBe('agenda.validation.timeBlockOutsideHours');
  });

  it('accepts boundary values (06:00 - 21:00)', () => {
    expect(validateTimeBlock('06:00', '21:00')).toBeNull();
  });
});

// ── validateNoOverlap ─────────────────────────────────────────────────────────

describe('validateNoOverlap', () => {
  it('returns null for non-overlapping blocks', () => {
    const blocks = [
      { startTime: '09:00', endTime: '11:00' },
      { startTime: '14:00', endTime: '17:00' },
    ];
    expect(validateNoOverlap(blocks)).toBeNull();
  });

  it('returns null for a single block', () => {
    expect(validateNoOverlap([{ startTime: '09:00', endTime: '11:00' }])).toBeNull();
  });

  it('returns timeBlockOverlap for overlapping blocks', () => {
    const blocks = [
      { startTime: '09:00', endTime: '11:00' },
      { startTime: '10:00', endTime: '12:00' },
    ];
    expect(validateNoOverlap(blocks)).toBe('agenda.validation.timeBlockOverlap');
  });

  it('returns timeBlockOverlap when one block starts exactly when another ends', () => {
    // Adjacent blocks are fine (end == start is NOT overlap)
    const blocks = [
      { startTime: '09:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '13:00' },
    ];
    // Adjacent (touching) blocks should NOT be an overlap
    expect(validateNoOverlap(blocks)).toBeNull();
  });

  it('handles unsorted input correctly', () => {
    const blocks = [
      { startTime: '14:00', endTime: '17:00' },
      { startTime: '09:00', endTime: '11:00' },
    ];
    expect(validateNoOverlap(blocks)).toBeNull();
  });
});

// ── validateNotPastToday ──────────────────────────────────────────────────────

describe('validateNotPastToday', () => {
  const TODAY = '2026-05-21';

  beforeEach(() => {
    // Fix current time to 10:00 on the test date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for future blocks today', () => {
    const blocks = [{ startTime: '11:00', endTime: '13:00' }];
    expect(validateNotPastToday(TODAY, blocks, TODAY)).toBeNull();
  });

  it('returns timeBlockPast for a past block today', () => {
    const blocks = [{ startTime: '09:00', endTime: '10:30' }];
    expect(validateNotPastToday(TODAY, blocks, TODAY)).toBe('agenda.validation.timeBlockPast');
  });

  it('returns null for any block on a future date', () => {
    const blocks = [{ startTime: '09:00', endTime: '10:30' }];
    expect(validateNotPastToday('2026-05-22', blocks, TODAY)).toBeNull();
  });

  it('returns null for any block on a past date (not today)', () => {
    // A past date is shown as "already past day" — but that's a day-selector concern
    const blocks = [{ startTime: '09:00', endTime: '10:30' }];
    expect(validateNotPastToday('2026-05-20', blocks, TODAY)).toBeNull();
  });
});
