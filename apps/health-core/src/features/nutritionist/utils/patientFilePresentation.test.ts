import { describe, expect, it, vi } from 'vitest';

import {
  calculateBmi,
  formatHeightInMeters,
  formatObservationDateTime,
  getAgeFromBirthDate,
  getDisplayIdentity,
} from './patientFilePresentation';

describe('patientFilePresentation', () => {
  it('returns a fallback identity when the user id is blank', () => {
    expect(getDisplayIdentity('   ')).toBe('Paciente');
  });

  it('calculates the age from a valid birth date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T12:00:00.000Z'));

    expect(getAgeFromBirthDate('1996-05-13')).toBe(30);

    vi.useRealTimers();
  });

  it('formats the patient height in meters', () => {
    expect(formatHeightInMeters(168)).toBe('1.68 m');
  });

  it('calculates bmi with one decimal place', () => {
    expect(calculateBmi(64, 168)).toBe('22.7');
  });

  it('returns the raw observation value when the date is invalid', () => {
    expect(formatObservationDateTime('invalid', 'en-US')).toBe('invalid');
  });
});
