import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import {
  clinicalApi,
  getPatientObservations,
} from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
  ObservationResponse,
} from '@/features/clinical/types/clinical.types';
import { logClientError, logClientInfo } from '@/core/utils/logger';

type PatientFileTab = 'overview' | 'plan' | 'history' | 'observations';

interface UseNutritionistPatientClinicalDataOptions {
  patientId: string;
  activeTab: PatientFileTab;
}

interface UseNutritionistPatientClinicalDataReturn {
  patient: NutritionistPatientProfileResponse | null;
  setPatient: Dispatch<SetStateAction<NutritionistPatientProfileResponse | null>>;
  isLoadingPatient: boolean;
  patientLoadError: string | null;
  observations: ObservationResponse[];
  nutritionPlanView: NutritionPlanViewResponse | null;
  setNutritionPlanView: Dispatch<SetStateAction<NutritionPlanViewResponse | null>>;
  isLoadingNutritionPlan: boolean;
  nutritionPlanLoadError: string | null;
  setNutritionPlanLoadError: Dispatch<SetStateAction<string | null>>;
  loadPatient: ({ showLoading }?: { showLoading?: boolean }) => Promise<NutritionistPatientProfileResponse | null>;
  loadObservations: () => Promise<ObservationResponse[]>;
  loadNutritionPlan: () => Promise<NutritionPlanViewResponse | null>;
}

export const useNutritionistPatientClinicalData = ({
  patientId,
  activeTab,
}: UseNutritionistPatientClinicalDataOptions): UseNutritionistPatientClinicalDataReturn => {
  const { t } = useTranslation('nutritionist');
  const [patient, setPatient] = useState<NutritionistPatientProfileResponse | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [nutritionPlanView, setNutritionPlanView] = useState<NutritionPlanViewResponse | null>(null);
  const [isLoadingNutritionPlan, setIsLoadingNutritionPlan] = useState(false);
  const [nutritionPlanLoadError, setNutritionPlanLoadError] = useState<string | null>(null);
  const hasHydratedOverviewRef = useRef(false);

  const loadPatient = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (!patientId) {
        setPatientLoadError(t('patients.file.error'));
        setIsLoadingPatient(false);
        return null;
      }

      try {
        if (showLoading) {
          setIsLoadingPatient(true);
        }
        setPatientLoadError(null);
        logClientInfo('NutritionistPatientFilePage.patient.load.start', { patientId });
        const response = await clinicalApi.getNutritionistPatientProfile(patientId);
        setPatient(response);
        logClientInfo('NutritionistPatientFilePage.patient.load.success', {
          patientId,
          patientUserId: response.userId,
        });
        return response;
      } catch (error) {
        logClientError('NutritionistPatientFilePage.patient.load.error', error, { patientId });
        setPatientLoadError(t('patients.file.error'));
        return null;
      } finally {
        if (showLoading) {
          setIsLoadingPatient(false);
        }
      }
    },
    [patientId, t]
  );

  const loadNutritionPlan = useCallback(async () => {
    if (!patientId) {
      return null;
    }

    try {
      setIsLoadingNutritionPlan(true);
      setNutritionPlanLoadError(null);
      logClientInfo('NutritionistPatientFilePage.plan.load.start', { patientId });
      const response = await clinicalApi.getNutritionistPatientNutritionPlan(patientId);
      setNutritionPlanView(response);
      logClientInfo('NutritionistPatientFilePage.plan.load.success', {
        patientId,
        mode: response.mode,
        canEdit: response.canEdit,
        sections: response.sections.length,
      });
      return response;
    } catch (error) {
      logClientError('NutritionistPatientFilePage.plan.load.error', error, { patientId });
      setNutritionPlanView(null);
      setNutritionPlanLoadError(t('nutritionPlan.loadError'));
      return null;
    } finally {
      setIsLoadingNutritionPlan(false);
    }
  }, [patientId, t]);

  const loadObservations = useCallback(async () => {
    if (!patientId) {
      setObservations([]);
      return [];
    }

    try {
      const data = await getPatientObservations(patientId);
      setObservations(data);
      return data;
    } catch (error) {
      logClientError('NutritionistPatientFilePage.observations.load.error', error, { patientId });
      return [];
    }
  }, [patientId]);

  useEffect(() => {
    void loadPatient();
  }, [loadPatient]);

  useEffect(() => {
    if (!patientId) {
      return;
    }

    void loadObservations();
  }, [loadObservations, patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== 'plan') {
      return;
    }

    void loadNutritionPlan();
  }, [activeTab, loadNutritionPlan, patientId]);

  useEffect(() => {
    hasHydratedOverviewRef.current = false;
  }, [patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== 'overview') {
      return;
    }

    if (!hasHydratedOverviewRef.current) {
      hasHydratedOverviewRef.current = true;
      return;
    }

    void loadPatient({ showLoading: false });
  }, [activeTab, loadPatient, patientId]);

  return {
    patient,
    setPatient,
    isLoadingPatient,
    patientLoadError,
    observations,
    nutritionPlanView,
    setNutritionPlanView,
    isLoadingNutritionPlan,
    nutritionPlanLoadError,
    setNutritionPlanLoadError,
    loadPatient,
    loadObservations,
    loadNutritionPlan,
  };
};
