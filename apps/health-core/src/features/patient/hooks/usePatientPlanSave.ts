import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { logClientError, logClientInfo } from '@/core/utils/logger';

interface UsePatientPlanSaveOptions {
  setView: React.Dispatch<React.SetStateAction<NutritionPlanViewResponse | null>>;
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePatientPlanSave = ({
  setView,
  setLoadError,
}: UsePatientPlanSaveOptions) => {
  const handleSave = async (payload: Parameters<typeof clinicalApi.upsertMyNutritionPlan>[0]) => {
    try {
      logClientInfo('PatientPlanPage.save.start', { sections: payload.sections.length });
      const response = await clinicalApi.upsertMyNutritionPlan(payload);
      setView(response);
      setLoadError(null);
      logClientInfo('PatientPlanPage.save.success', { mode: response.mode, canEdit: response.canEdit });
      return response;
    } catch (error) {
      logClientError('PatientPlanPage.save.error', error, { sections: payload.sections.length });
      throw error;
    }
  };

  return {
    handleSave,
  };
};
