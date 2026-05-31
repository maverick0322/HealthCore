import { useTranslation } from 'react-i18next';
import { TrendingDown } from 'lucide-react';

import type { NutritionistReportsData, NutritionistReportRangeKey } from '@/features/nutritionist/types/report.types';
import { getWeightChangeToneClassName } from '@/features/nutritionist/utils/reporting';
import {
  formatLongDate,
  formatWeight,
  formatWeightChange,
} from '@/features/nutritionist/utils/reportsPresentation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface NutritionistReportsWeightTableCardProps {
  data: NutritionistReportsData;
  rangeKey: NutritionistReportRangeKey;
  latestWeightReportDate: string | null;
  locale: string;
}

export function NutritionistReportsWeightTableCard({
  data,
  rangeKey,
  latestWeightReportDate,
  locale,
}: Readonly<NutritionistReportsWeightTableCardProps>) {
  const { t } = useTranslation('nutritionist');

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <TrendingDown size={18} className="text-primary" />
          {t('reports.weightTable.title')}
        </CardTitle>
        <CardDescription className="text-xs">
          {latestWeightReportDate
            ? `${t('reports.weightTable.latestDate', {
                date: formatLongDate(latestWeightReportDate, locale),
              })} · ${t(`reports.ranges.${rangeKey}`)}`
            : `${t('reports.weightTable.noLatestDate')} · ${t(`reports.ranges.${rangeKey}`)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b border-border/50 px-6 py-3 text-xs text-muted-foreground">
          {t('reports.weightTable.summary')}
        </div>
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
                      ? formatLongDate(row.latestRecordDateInRange, locale)
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
  );
}
