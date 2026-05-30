import { useTranslation } from 'react-i18next';
import { CalendarCheck2 } from 'lucide-react';

import type { NutritionistReportsData } from '@/features/nutritionist/types/report.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionistReportsAppointmentsCardProps {
  data: NutritionistReportsData;
  chartSummaryText: string;
}

export function NutritionistReportsAppointmentsCard({
  data,
  chartSummaryText,
}: Readonly<NutritionistReportsAppointmentsCardProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <CalendarCheck2 size={18} className="text-primary" />
          {t('reports.appointments.title')}
        </CardTitle>
        <CardDescription className="text-sm font-medium text-foreground">
          {chartSummaryText}
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

            <p className="text-xs text-muted-foreground">
              {t('reports.appointments.helper')}
            </p>
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
  );
}
