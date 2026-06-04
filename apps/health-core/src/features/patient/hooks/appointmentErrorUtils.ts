import axios from 'axios';

const WEEKLY_LIMIT_PATTERNS = [
  '7 dias',
  '7 días',
  'dentro de los proximos 7 dias',
  'dentro de los próximos 7 días',
];

export const getAxiosErrorMessage = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;
  if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }

  return null;
};

export const isWeeklyAppointmentLimitConflict = (error: unknown): boolean => {
  const message = getAxiosErrorMessage(error)?.toLowerCase();
  if (!message) {
    return false;
  }

  return WEEKLY_LIMIT_PATTERNS.some((pattern) => message.includes(pattern));
};
