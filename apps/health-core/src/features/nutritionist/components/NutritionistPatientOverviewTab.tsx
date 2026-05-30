import { useTranslation } from 'react-i18next';
import { CalendarDays, Flame, Ruler, SquarePen, User, Weight } from 'lucide-react';

import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { formatPatientGoalLabel } from '@/features/onboarding/utils/profilePresentation';
import {
  calculateBmi,
  formatHeightInMeters,
} from '@/features/nutritionist/utils/patientFilePresentation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionistPatientOverviewTabProps {
  patient: NutritionistPatientProfileResponse;
  patientAge: number | null;
  onOpenEditMetrics: () => void;
}

export const NutritionistPatientOverviewTab = ({
  patient,
  patientAge,
  onOpenEditMetrics,
}: NutritionistPatientOverviewTabProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 border-b border-border/50">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={18} className="text-primary" /> {t('patients.file.tabOverview')}
          </CardTitle>
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={onOpenEditMetrics}>
            <SquarePen size={14} />
            {t('patients.file.metrics.button')}
          </Button>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
              <CalendarDays size={18} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                {t('patients.file.age')}
              </p>
              <p className="text-lg font-bold">
                {patientAge !== null ? `${patientAge} ${t('patients.file.years')}` : '--'}
              </p>
            </div>
            <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
              <Weight size={18} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                {t('patients.file.weight')}
              </p>
              <p className="text-lg font-bold">{patient.weightKg} kg</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
              <Ruler size={18} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                {t('patients.file.height')}
              </p>
              <p className="text-lg font-bold">{formatHeightInMeters(patient.heightCm)}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center flex flex-col justify-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">IMC</p>
              <p className="text-xl font-bold text-primary">
                {calculateBmi(patient.weightKg, patient.heightCm)}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
            <Flame size={20} className="text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">
                {t('patients.file.objective')}
              </h4>
              <p className="text-amber-600/90 dark:text-amber-400/90 text-sm">
                {formatPatientGoalLabel(t, patient.goal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
