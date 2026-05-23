/**
 * Pure validation functions for the agenda domain (agenda-service).
 * All functions return a translation key string on failure, or null on success.
 * Keys are resolved by the caller via useTranslation('nutritionist') or ('patient').
 */

const EARLIEST_SLOT_TIME = '06:00';
const LATEST_SLOT_TIME = '21:00';

// ── Appointment duration ──────────────────────────────────────────────────────

export const validateDuration = (minutes: number): string | null => {
  if (!Number.isInteger(minutes)) return 'agenda.validation.durationNotInteger';
  if (minutes < 15) return 'agenda.validation.durationTooShort';
  if (minutes > 120) return 'agenda.validation.durationTooLong';
  return null;
};

// ── Single time block (startTime / endTime as HH:mm strings) ─────────────────

export const validateTimeBlock = (
  startTime: string,
  endTime: string,
): string | null => {
  if (!startTime || !endTime) return 'agenda.validation.timeBlockRequired';
  if (startTime >= endTime) return 'agenda.validation.timeBlockOrder';
  if (startTime < EARLIEST_SLOT_TIME || endTime > LATEST_SLOT_TIME) {
    return 'agenda.validation.timeBlockOutsideHours';
  }
  return null;
};

// ── No overlapping blocks ─────────────────────────────────────────────────────

interface TimeBlock {
  startTime: string;
  endTime: string;
}

export const validateNoOverlap = (blocks: TimeBlock[]): string | null => {
  const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      return 'agenda.validation.timeBlockOverlap';
    }
  }
  return null;
};

// ── Blocks must not start in the past (today only) ───────────────────────────

export const validateNotPastToday = (
  dateKey: string,
  blocks: TimeBlock[],
  todayKey: string,
): string | null => {
  if (dateKey !== todayKey) return null;
  const now = new Date();
  for (const block of blocks) {
    const [hours, minutes] = block.startTime.split(':').map(Number);
    const blockStart = new Date();
    blockStart.setHours(hours, minutes, 0, 0);
    if (blockStart <= now) {
      return 'agenda.validation.timeBlockPast';
    }
  }
  return null;
};
