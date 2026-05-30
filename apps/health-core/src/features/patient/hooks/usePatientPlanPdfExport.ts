import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  NutritionPlanViewResponse,
  ObservationResponse,
  PatientProfileResponse,
} from '@/features/clinical/types/clinical.types';
import { exportPatientNutritionPlanPdf } from '@/features/patient/services/patientNutritionPlanPdfService';
import { logClientError } from '@/core/utils/logger';

interface UsePatientPlanPdfExportOptions {
  view: NutritionPlanViewResponse | null;
  profile: PatientProfileResponse | null;
  observations: ObservationResponse[];
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePatientPlanPdfExport = ({
  view,
  profile,
  observations,
  setLoadError,
}: UsePatientPlanPdfExportOptions) => {
  const { t, i18n } = useTranslation('patient');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!view) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const patientName = profile?.fullName ?? profile?.firstName ?? null;
      const sanitizedPatientName = (patientName || 'plan-nutricional')
        .replace(/[^\w-]+/g, '-')
        .toLowerCase();

      await exportPatientNutritionPlanPdf({
        fileName: `plan-nutricional-${sanitizedPatientName}.pdf`,
        locale: i18n.language,
        patientName,
        view,
        observations,
        labels: {
          title: t('nutritionPlan.pdf.title'),
          generatedOn: t('nutritionPlan.pdf.generatedOn'),
          patient: t('nutritionPlan.pdf.patient'),
          sections: {
            dailyGoals: t('nutritionPlan.pdf.sections.dailyGoals'),
            currentPlan: t('nutritionPlan.pdf.sections.currentPlan'),
            previousPlan: t('nutritionPlan.contextTitle'),
            observations: t('nutritionPlan.observationsTitle'),
          },
          fields: {
            calories: t('nutritionPlan.calories'),
            protein: t('nutritionPlan.protein'),
            carbs: t('nutritionPlan.carbs'),
            fat: t('nutritionPlan.fat'),
            hydration: t('nutritionPlan.pdf.hydration'),
            mealSlot: t('nutritionPlan.pdf.mealSlot'),
            dish: t('nutritionPlan.pdf.dish'),
            ingredients: t('nutritionPlan.ingredients'),
            instructions: t('nutritionPlan.instructions'),
            notes: t('nutritionPlan.notes'),
            updatedAt: t('nutritionPlan.pdf.updatedAt'),
          },
          empty: {
            plan: t('nutritionPlan.pdf.empty.plan'),
            observations: t('nutritionPlan.noObservations'),
            previousPlan: t('nutritionPlan.pdf.empty.previousPlan'),
            none: t('nutritionPlan.pdf.empty.none'),
            noInstructions: t('nutritionPlan.noInstructions'),
            noNotes: t('nutritionPlan.noNotes'),
          },
          mealSlots: {
            BREAKFAST: t('nutritionPlan.mealSlots.BREAKFAST'),
            LUNCH: t('nutritionPlan.mealSlots.LUNCH'),
            DINNER: t('nutritionPlan.mealSlots.DINNER'),
            SNACK: t('nutritionPlan.mealSlots.SNACK'),
          },
          units: {
            GRAMS: t('nutritionPlan.units.GRAMS'),
            MILLILITERS: t('nutritionPlan.units.MILLILITERS'),
          },
        },
      });
    } catch (error) {
      logClientError('PatientPlanPage.pdf.export.error', error);
      setLoadError(t('nutritionPlan.pdf.error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return {
    isExportingPdf,
    handleExportPdf,
  };
};
