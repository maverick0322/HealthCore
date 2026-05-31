import { useTranslation } from 'react-i18next';
import { CalendarCheck2, Users } from 'lucide-react';

import type { NutritionistReportsData } from '@/features/nutritionist/types/report.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionistReportsOverviewCardsProps {
  data: NutritionistReportsData;
}

export function NutritionistReportsOverviewCards({
  data,
}: Readonly<NutritionistReportsOverviewCardsProps>) {
  const { t } = useTranslation('nutritionist');

  return (
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
  );
}
