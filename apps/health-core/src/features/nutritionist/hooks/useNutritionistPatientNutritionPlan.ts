import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { logClientError, logClientInfo } from '@/core/utils/logger';

interface UseNutritionistPatientNutritionPlanOptions {
  patientId: string;
  loadNutritionPlan: () => Promise<NutritionPlanViewResponse | null>;
  setNutritionPlanView: React.Dispatch<React.SetStateAction<NutritionPlanViewResponse | null>>;
  setNutritionPlanLoadError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useNutritionistPatientNutritionPlan = ({
  patientId,
  loadNutritionPlan,
  setNutritionPlanView,
  setNutritionPlanLoadError,
}: UseNutritionistPatientNutritionPlanOptions) => {
  const { t } = useTranslation('nutritionist');

  const handleSaveNutritionPlan = async (
    payload: Parameters<typeof clinicalApi.upsertNutritionistPatientNutritionPlan>[1]
  ) => {
    try {
      logClientInfo('NutritionistPatientFilePage.plan.save.start', {
        patientId,
        sections: payload.sections.length,
      });
      const response = await clinicalApi.upsertNutritionistPatientNutritionPlan(patientId, payload);
      setNutritionPlanView(response);
      setNutritionPlanLoadError(null);
      logClientInfo('NutritionistPatientFilePage.plan.save.success', {
        patientId,
        mode: response.mode,
        canEdit: response.canEdit,
      });
      return response;
    } catch (error) {
      logClientError('NutritionistPatientFilePage.plan.save.error', error, {
        patientId,
        sections: payload.sections.length,
      });
      throw error;
    }
  };

  const retryNutritionPlanLoad = async () => {
    if (!patientId) {
      return;
    }

    logClientInfo('NutritionistPatientFilePage.plan.retry.start', { patientId });
    await loadNutritionPlan();
  };

  return {
    nutritionPlanLoadErrorText: t('nutritionPlan.loadErrorHelp'),
    handleSaveNutritionPlan,
    retryNutritionPlanLoad,
  };
};
