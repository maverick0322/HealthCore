import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { NutritionistReportsAppointmentsCard } from '@/features/nutritionist/components/NutritionistReportsAppointmentsCard';
import { NutritionistReportsHeader } from '@/features/nutritionist/components/NutritionistReportsHeader';
import { NutritionistReportsOverviewCards } from '@/features/nutritionist/components/NutritionistReportsOverviewCards';
import { NutritionistReportsRangeSelector } from '@/features/nutritionist/components/NutritionistReportsRangeSelector';
import { NutritionistReportsWeightTableCard } from '@/features/nutritionist/components/NutritionistReportsWeightTableCard';
import { useNutritionistReports } from '@/features/nutritionist/hooks/useNutritionistReports';
import { exportNutritionistReportPdf } from '@/features/nutritionist/services/reportPdfService';
import type { NutritionistReportRangeKey } from '@/features/nutritionist/types/report.types';
import { getLatestWeightReportDate } from '@/features/nutritionist/utils/reporting';
import { buildAppointmentSummaryText, formatRangeWindowText } from '@/features/nutritionist/utils/reportsPresentation';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';

export const NutritionistReportsPage = () => {
  const { t, i18n } = useTranslation('nutritionist');
  const [rangeKey, setRangeKey] = useState<NutritionistReportRangeKey>('1m');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useNutritionistReports(rangeKey);

  const latestWeightReportDate = useMemo(
    () => getLatestWeightReportDate(data?.weightReport.rows ?? []),
    [data],
  );

  const handleExport = async () => {
    if (!data) {
      return;
    }

    setIsExporting(true);
    try {
      const appointmentSummaryText = data.appointmentSummary.relevantCount > 0
        ? buildAppointmentSummaryText(
            t,
            data.appointmentSummary.attendedCount,
            data.appointmentSummary.cancelledCount,
          )
        : t('reports.appointments.summary.empty');

      await exportNutritionistReportPdf({
        fileName: `nutritionist-report-${data.period.fromDateKey}-to-${data.period.toDateKey}.pdf`,
        locale: i18n.language,
        activeRangeLabel: t(`reports.ranges.${rangeKey}`),
        activeRangeWindowText: formatRangeWindowText(
          data.period.fromDateKey,
          data.period.toDateKey,
          i18n.language,
          t,
        ),
        appointmentSummaryText,
        appointmentSummary: data.appointmentSummary,
        weightReport: data.weightReport,
        labels: {
          title: t('reports.title'),
          generatedOn: t('reports.pdf.generatedOn'),
          activeRange: t('reports.pdf.activeRange'),
          rangeWindow: t('reports.pdf.rangeWindow'),
          sections: {
            overview: t('reports.pdf.sections.overview'),
            appointments: t('reports.appointments.title'),
            weightTable: t('reports.weightTable.title'),
          },
          kpis: {
            totalPatients: t('reports.kpis.totalPatients'),
            attendedAppointments: t('reports.kpis.attendedAppointments'),
          },
          appointments: {
            attended: t('reports.appointments.attended'),
            cancelled: t('reports.appointments.cancelled'),
            empty: t('reports.appointments.empty'),
            helper: t('reports.appointments.helper'),
          },
          weightTable: {
            noRecords: t('reports.weightTable.noRecords'),
            empty: t('reports.weightTable.empty'),
            summary: t('reports.weightTable.summary'),
            columns: {
              patient: t('reports.weightTable.columns.patient'),
              latestRecord: t('reports.weightTable.columns.latestRecord'),
              startWeight: t('reports.weightTable.columns.startWeight'),
              currentWeight: t('reports.weightTable.columns.currentWeight'),
              netChange: t('reports.weightTable.columns.netChange'),
            },
          },
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const chartSummaryText = data && data.appointmentSummary.relevantCount > 0
    ? buildAppointmentSummaryText(
        t,
        data.appointmentSummary.attendedCount,
        data.appointmentSummary.cancelledCount,
      )
    : t('reports.appointments.summary.empty');

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <NutritionistReportsHeader
        locale={i18n.language}
        isLoading={isLoading}
        isExporting={isExporting}
        hasData={Boolean(data)}
        onExport={() => {
          void handleExport();
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56">
        <div className="space-y-6">
          <NutritionistReportsRangeSelector rangeKey={rangeKey} onChangeRange={setRangeKey} />

          {data ? (
            <p className="text-sm text-muted-foreground">
              {formatRangeWindowText(data.period.fromDateKey, data.period.toDateKey, i18n.language, t)}
            </p>
          ) : null}

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
              <NutritionistReportsOverviewCards data={data} />
              <NutritionistReportsAppointmentsCard
                data={data}
                chartSummaryText={chartSummaryText}
              />
              <NutritionistReportsWeightTableCard
                data={data}
                rangeKey={rangeKey}
                latestWeightReportDate={latestWeightReportDate}
                locale={i18n.language}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};
