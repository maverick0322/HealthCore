import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  ObservationResponse,
  PatientProfileResponse,
} from '@/features/clinical/types/clinical.types';
import { logClientError, logClientInfo } from '@/core/utils/logger';

interface LoadPlanOptions {
  showLoading?: boolean;
  source?: 'load' | 'retry' | 'focus';
}

export const usePatientPlanData = () => {
  const { t } = useTranslation('patient');
  const [view, setView] = useState<NutritionPlanViewResponse | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [hasLinkedNutritionist, setHasLinkedNutritionist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlan = useCallback(
    async ({ showLoading = true, source = 'load' }: LoadPlanOptions = {}) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        logClientInfo(`PatientPlanPage.${source}.start`);
        setLoadError(null);
        const [response, nextProfile] = await Promise.all([
          clinicalApi.getMyNutritionPlan(),
          clinicalApi.getMyProfile().catch(() => null),
        ]);
        const linkedNutritionist = Boolean(nextProfile?.nutritionistId);
        let observationResponse: ObservationResponse[] = [];

        if (linkedNutritionist) {
          try {
            observationResponse = await clinicalApi.getMyObservations();
          } catch (error) {
            logClientError(`PatientPlanPage.observations.${source}.error`, error);
          }
        }

        setHasLinkedNutritionist(linkedNutritionist);
        setProfile(nextProfile);
        setView(response);
        setObservations(observationResponse);

        logClientInfo(`PatientPlanPage.${source}.success`, {
          mode: response.mode,
          canEdit: response.canEdit,
          sections: response.sections.length,
          observations: observationResponse.length,
          linkedNutritionist,
        });
      } catch (error) {
        logClientError(`PatientPlanPage.${source}.error`, error);
        setLoadError(t('nutritionPlan.loadError'));
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    const handleWindowRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadPlan({ showLoading: false, source: 'focus' });
      }
    };

    window.addEventListener('focus', handleWindowRefresh);
    document.addEventListener('visibilitychange', handleWindowRefresh);

    return () => {
      window.removeEventListener('focus', handleWindowRefresh);
      document.removeEventListener('visibilitychange', handleWindowRefresh);
    };
  }, [loadPlan]);

  const retryLoad = async () => {
    await loadPlan({ showLoading: true, source: 'retry' });
  };

  return {
    view,
    setView,
    observations,
    profile,
    hasLinkedNutritionist,
    isLoading,
    loadError,
    setLoadError,
    loadPlan,
    retryLoad,
  };
};
