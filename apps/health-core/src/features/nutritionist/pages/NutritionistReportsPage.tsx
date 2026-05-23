import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CalendarCheck2,
  FileDown,
  Loader2,
  TrendingDown,
  Users,
} from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { useNutritionistReports } from '@/features/nutritionist/hooks/useNutritionistReports';
import { exportNutritionistReportPdf } from '@/features/nutritionist/services/reportPdfService';
import type { NutritionistReportRangeKey } from '@/features/nutritionist/types/report.types';
import {
  getLatestWeightReportDate,
  getWeightChangeToneClassName,
  NUTRITIONIST_REPORT_RANGE_OPTIONS,
} from '@/features/nutritionist/utils/reporting';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const formatWeight = (value: number | null) => (value == null ? '--' : `${value.toFixed(1)} kg`);

const formatWeightChange = (value: number | null) => {
  if (value == null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} kg`;
};

const formatLongDate = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const NutritionistReportsPage = () => {
  const { t, i18n } = useTranslation('nutritionist');
  const [rangeKey, setRangeKey] = useState<NutritionistReportRangeKey>('1m');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, refetch } = useNutritionistReports(rangeKey);

  const latestWeightReportDate = useMemo(
    () => getLatestWeightReportDate(data?.weightReport.rows ?? []),
    [data]
  );

  const handleExport = async () => {
    if (!reportRef.current || !data) {
      return;
    }

    setIsExporting(true);
    try {
      await exportNutritionistReportPdf({
        element: reportRef.current,
        fileName: `nutritionist-report-${data.period.fromDateKey}-to-${data.period.toDateKey}.pdf`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const chartSummaryKey = data && data.appointmentSummary.relevantCount > 0
    ? 'reports.appointments.summary.withData'
    : 'reports.appointments.summary.empty';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t('reports.title')}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('reports.subtitle')}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('reports.generatedOn', {
                  date: new Date().toLocaleDateString(i18n.language, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </p>
            </div>

            <Button
              type="button"
              className="gap-2 self-start"
              onClick={() => {
                void handleExport();
              }}
              disabled={isLoading || isExporting || !data}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {isExporting ? t('reports.exportingPdf') : t('reports.exportPdf')}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56">
        <div ref={reportRef} className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {NUTRITIONIST_REPORT_RANGE_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={rangeKey === option ? 'default' : 'outline'}
                onClick={() => setRangeKey(option)}
              >
                {t(`reports.ranges.${option}`)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[0, 1].map((index) => (
                  <div key={index} className="h-28 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
              <div className="h-72 rounded-2xl bg-muted animate-pulse" />
              <div className="h-96 rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{t('reports.error')}</span>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                {t('reports.retry')}
              </Button>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-primary">
                      {t('reports.kpis.totalPatients')}
                    </CardTitle>
                    <Users size={16} className="text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {data.weightReport.activePatients}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {t('reports.kpis.attendedAppointments')}
                    </CardTitle>
                    <CalendarCheck2 size={16} className="text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {data.appointmentSummary.attendedCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <CalendarCheck2 size={18} className="text-primary" />
                    {t('reports.appointments.title')}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-foreground">
                    {t(chartSummaryKey, {
                      attended: data.appointmentSummary.attendedCount,
                      cancelled: data.appointmentSummary.cancelledCount,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {data.appointmentSummary.relevantCount > 0 ? (
                    <>
                      <div className="overflow-hidden rounded-full bg-muted">
                        <div className="flex h-5 w-full">
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${data.appointmentSummary.attendedPercent}%` }}
                          />
                          <div
                            className="bg-rose-500 transition-all"
                            style={{ width: `${data.appointmentSummary.cancelledPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            {t('reports.appointments.attended')}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-400">
                            {data.appointmentSummary.attendedCount}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('reports.appointments.percent', {
                              percent: data.appointmentSummary.attendedPercent,
                            })}
                          </p>
                        </div>

                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                          <p className="text-xs text-rose-700 dark:text-rose-400">
                            {t('reports.appointments.cancelled')}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-rose-700 dark:text-rose-400">
                            {data.appointmentSummary.cancelledCount}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('reports.appointments.percent', {
                              percent: data.appointmentSummary.cancelledPercent,
                            })}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                      <CalendarCheck2 size={28} className="mx-auto text-muted-foreground/40" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        {t('reports.appointments.empty')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <TrendingDown size={18} className="text-primary" />
                    {t('reports.weightTable.title')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {latestWeightReportDate
                      ? t('reports.weightTable.latestDate', {
                          date: formatLongDate(latestWeightReportDate, i18n.language),
                        })
                      : t('reports.weightTable.noLatestDate')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {data.weightReport.rows.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('reports.weightTable.columns.patient')}</TableHead>
                          <TableHead>{t('reports.weightTable.columns.latestRecord')}</TableHead>
                          <TableHead>{t('reports.weightTable.columns.startWeight')}</TableHead>
                          <TableHead>{t('reports.weightTable.columns.currentWeight')}</TableHead>
                          <TableHead>{t('reports.weightTable.columns.netChange')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.weightReport.rows.map((row) => (
                          <TableRow key={row.patientId}>
                            <TableCell className="font-medium">{row.fullName}</TableCell>
                            <TableCell>
                              {row.latestRecordDateInRange
                                ? formatLongDate(row.latestRecordDateInRange, i18n.language)
                                : t('reports.weightTable.noRecords')}
                            </TableCell>
                            <TableCell>{formatWeight(row.startWeightKg)}</TableCell>
                            <TableCell>{formatWeight(row.currentWeightKg)}</TableCell>
                            <TableCell className={getWeightChangeToneClassName(row.netChangeKg)}>
                              {formatWeightChange(row.netChangeKg)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                      {t('reports.weightTable.empty')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};
