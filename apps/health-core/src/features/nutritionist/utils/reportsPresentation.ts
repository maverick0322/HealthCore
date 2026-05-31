import type { TFunction } from 'i18next';

export const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

export const formatWeightChange = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

export const formatLongDate = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatRangeWindowText = (
  fromDate: string,
  toDate: string,
  locale: string,
  t: TFunction<'nutritionist'>,
) =>
  t('reports.rangeWindow', {
    from: formatLongDate(fromDate, locale),
    to: formatLongDate(toDate, locale),
  });

export const buildAppointmentSummaryText = (
  t: TFunction<'nutritionist'>,
  attendedCount: number,
  cancelledCount: number,
) => {
  const attendedKey = attendedCount === 1
    ? 'reports.appointments.summary.attended_one'
    : 'reports.appointments.summary.attended_other';
  const cancelledKey = cancelledCount === 1
    ? 'reports.appointments.summary.cancelled_one'
    : 'reports.appointments.summary.cancelled_other';

  return [
    t('reports.appointments.summary.prefix'),
    t(attendedKey, { count: attendedCount }),
    t('reports.appointments.summary.connector'),
    t(cancelledKey, { count: cancelledCount }),
  ].join(' ');
};
