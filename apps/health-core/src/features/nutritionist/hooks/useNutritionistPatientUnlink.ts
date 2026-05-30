import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { getNutritionistUnlinkErrorMessage } from '@/features/clinical/utils/linkingErrorMessages';
import { logClientError } from '@/core/utils/logger';

interface PatientFileFeedback {
  type: 'success' | 'error';
  message: string;
}

interface UseNutritionistPatientUnlinkOptions {
  patientId: string;
  navigate: NavigateFunction;
  setPageFeedback: Dispatch<SetStateAction<PatientFileFeedback | null>>;
  closeUnlinkModal: () => void;
}

export const useNutritionistPatientUnlink = ({
  patientId,
  navigate,
  setPageFeedback,
  closeUnlinkModal,
}: UseNutritionistPatientUnlinkOptions) => {
  const { t } = useTranslation('nutritionist');
  const [isUnlinking, setIsUnlinking] = useState(false);

  const confirmUnlinkPatient = async () => {
    if (!patientId) {
      return;
    }

    setIsUnlinking(true);
    setPageFeedback(null);
    try {
      await clinicalApi.unlinkNutritionist(patientId);
      navigate('/patients/nutritionist');
    } catch (error) {
      logClientError('NutritionistPatientFilePage.unlink.error', error, { patientId });
      setPageFeedback({
        type: 'error',
        message: getNutritionistUnlinkErrorMessage(error, t),
      });
      closeUnlinkModal();
    } finally {
      setIsUnlinking(false);
    }
  };

  return {
    isUnlinking,
    confirmUnlinkPatient,
  };
};
