export const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const todayDateKey = () => toDateKey(new Date());

export const addDays = (dateKey: string, days: number): string => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const startOfWeek = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toDateKey(date);
};

export const getWeekDays = (weekStart: string): string[] =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

export const localDateKeyFromIso = (iso: string): string => toDateKey(new Date(iso));

export const getDateRangeForDateKeys = (fromDateKey: string, toDateKeyValue: string) => {
  const fromDate = parseDateKey(fromDateKey);
  const toDate = parseDateKey(toDateKeyValue);
  toDate.setHours(23, 59, 59, 999);
  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
};

export const getWeekRange = (weekStart: string) =>
  getDateRangeForDateKeys(weekStart, addDays(weekStart, 6));

export const formatLocalTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatLocalDate = (isoOrDateKey: string) => {
  const date = isoOrDateKey.includes('T') ? new Date(isoOrDateKey) : parseDateKey(isoOrDateKey);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatLocalDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
