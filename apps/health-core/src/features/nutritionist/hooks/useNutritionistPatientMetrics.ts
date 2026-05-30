import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
} from '@/features/clinical/types/clinical.types';
import { logClientError } from '@/core/utils/logger';

const WEIGHT_INPUT_PATTERN = /^\d{1,3}(?:\.\d)?$/;
const HEIGHT_INPUT_PATTERN = /^\d{3}$/;

interface PatientFileFeedback {
  type: 'success' | 'error';
  message: string;
}

interface UseNutritionistPatientMetricsOptions {
  patientId: string;
  patient: NutritionistPatientProfileResponse | null;
  nutritionPlanView: NutritionPlanViewResponse | null;
  setPatient: Dispatch<SetStateAction<NutritionistPatientProfileResponse | null>>;
  loadNutritionPlan: () => Promise<NutritionPlanViewResponse | null>;
  refetchWeightHistory: () => Promise<unknown>;
  setPageFeedback: Dispatch<SetStateAction<PatientFileFeedback | null>>;
}

export const useNutritionistPatientMetrics = ({
  patientId,
  patient,
  nutritionPlanView,
  setPatient,
  loadNutritionPlan,
  refetchWeightHistory,
  setPageFeedback,
}: UseNutritionistPatientMetricsOptions) => {
  const { t } = useTranslation('nutritionist');
  const [editMetricsOpen, setEditMetricsOpen] = useState(false);
  const [confirmEditMetricsOpen, setConfirmEditMetricsOpen] = useState(false);
  const [metricsWeightInput, setMetricsWeightInput] = useState('');
  const [metricsHeightInput, setMetricsHeightInput] = useState('');
  const [metricsErrors, setMetricsErrors] = useState<{ weightKg?: string; heightCm?: string }>({});
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);

  const resetMetricsDialog = () => {
    setEditMetricsOpen(false);
    setConfirmEditMetricsOpen(false);
    setMetricsErrors({});
    setMetricsWeightInput(patient?.weightKg?.toFixed(1) ?? '');
    setMetricsHeightInput(patient?.heightCm?.toFixed(0) ?? '');
  };

  const openEditMetricsDialog = () => {
    setMetricsWeightInput(patient?.weightKg?.toFixed(1) ?? '');
    setMetricsHeightInput(patient?.heightCm?.toFixed(0) ?? '');
    setMetricsErrors({});
    setConfirmEditMetricsOpen(false);
    setEditMetricsOpen(true);
  };

  const validateMetrics = () => {
    const nextErrors: { weightKg?: string; heightCm?: string } = {};
    const normalizedWeight = metricsWeightInput.trim();
    const normalizedHeight = metricsHeightInput.trim();

    if (!normalizedWeight) {
      nextErrors.weightKg = t('patients.file.metrics.validation.weightRequired');
    } else if (!WEIGHT_INPUT_PATTERN.test(normalizedWeight)) {
      nextErrors.weightKg = t('patients.file.metrics.validation.weightInvalid');
    } else {
      const parsedWeight = Number(normalizedWeight);
      if (Number.isNaN(parsedWeight) || parsedWeight < 40 || parsedWeight > 200) {
        nextErrors.weightKg = t('patients.file.metrics.validation.weightRange');
      }
    }

    if (!normalizedHeight) {
      nextErrors.heightCm = t('patients.file.metrics.validation.heightRequired');
    } else if (!HEIGHT_INPUT_PATTERN.test(normalizedHeight)) {
      nextErrors.heightCm = t('patients.file.metrics.validation.heightInvalid');
    } else {
      const parsedHeight = Number(normalizedHeight);
      if (Number.isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
        nextErrors.heightCm = t('patients.file.metrics.validation.heightRange');
      }
    }

    setMetricsErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReviewMetricsUpdate = () => {
    if (!validateMetrics()) {
      return;
    }

    setEditMetricsOpen(false);
    setConfirmEditMetricsOpen(true);
  };

  const handleConfirmMetricsUpdate = async () => {
    if (!patientId) {
      return;
    }

    setIsUpdatingMetrics(true);
    setPageFeedback(null);
    try {
      const updatedPatient = await clinicalApi.updateNutritionistPatientMetrics(patientId, {
        weightKg: Number(metricsWeightInput),
        heightCm: Number(metricsHeightInput),
      });
      setPatient(updatedPatient);
      await refetchWeightHistory();
      if (nutritionPlanView) {
        await loadNutritionPlan();
      }
      setConfirmEditMetricsOpen(false);
      setEditMetricsOpen(false);
    } catch (error) {
      logClientError('NutritionistPatientFilePage.metrics.update.error', error, { patientId });
      setPageFeedback({
        type: 'error',
        message: t('patients.file.metrics.updateError'),
      });
      setConfirmEditMetricsOpen(false);
      setEditMetricsOpen(true);
    } finally {
      setIsUpdatingMetrics(false);
    }
  };

  return {
    editMetricsOpen,
    setEditMetricsOpen,
    confirmEditMetricsOpen,
    setConfirmEditMetricsOpen,
    metricsWeightInput,
    setMetricsWeightInput,
    metricsHeightInput,
    setMetricsHeightInput,
    metricsErrors,
    isUpdatingMetrics,
    openEditMetricsDialog,
    resetMetricsDialog,
    handleReviewMetricsUpdate,
    handleConfirmMetricsUpdate,
  };
};
