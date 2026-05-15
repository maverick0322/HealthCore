import { describe, expect, it } from 'vitest';

import {
  addDays,
  getDateRangeForDateKeys,
  localDateKeyFromIso,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from './agendaDateUtils';

describe('agendaDateUtils', () => {
  it('formats local date keys without UTC slicing', () => {
    const date = parseDateKey('2026-05-20');

    expect(toDateKey(date)).toBe('2026-05-20');
  });

  it('calculates monday week starts', () => {
    expect(startOfWeek('2026-05-20')).toBe('2026-05-18');
    expect(startOfWeek('2026-05-24')).toBe('2026-05-18');
  });

  it('creates local-day ISO query ranges', () => {
    const range = getDateRangeForDateKeys('2026-05-20', '2026-05-20');

    expect(new Date(range.from).getFullYear()).toBe(2026);
    expect(new Date(range.from).getMonth()).toBe(4);
    expect(new Date(range.from).getDate()).toBe(20);
    expect(new Date(range.to).getHours()).toBe(23);
  });

  it('groups ISO instants by local date key', () => {
    const iso = new Date(2026, 4, 20, 9, 0, 0).toISOString();

    expect(localDateKeyFromIso(iso)).toBe('2026-05-20');
  });

  it('adds days on date keys', () => {
    expect(addDays('2026-05-20', 7)).toBe('2026-05-27');
  });
});
