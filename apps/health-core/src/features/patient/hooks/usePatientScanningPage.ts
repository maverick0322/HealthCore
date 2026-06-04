import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { getPatientLinkingErrorMessage } from '@/features/clinical/utils/linkingErrorMessages';
import { useProfileGuard } from '@/features/onboarding/hooks/useProfileGuard';
import { logClientError } from '@/core/utils/logger';

export const usePatientScanningPage = () => {
  const { t } = useTranslation('patient');
  const navigate = useNavigate();
  const { isLoading: profileLoading } = useProfileGuard();

  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyLinked, setIsAlreadyLinked] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    const checkLinkingStatus = async () => {
      try {
        const isLinked = await clinicalApi.isPatientLinked();
        setIsAlreadyLinked(isLinked);
      } catch (error) {
        logClientError('PatientScanningPage.checkLinkingStatus.error', error);
      }
    };

    if (!profileLoading) {
      void checkLinkingStatus();
    }
  }, [profileLoading]);

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  const handleUnlinkNutritionist = async () => {
    try {
      setIsUnlinking(true);
      await clinicalApi.unlinkPatient();
      setIsAlreadyLinked(false);
      setShowUnlinkDialog(false);
      setFeedback({ type: 'success', message: t('linking.unlinkSuccess') });

      globalThis.setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getPatientLinkingErrorMessage(error, t, 'unlink'),
      });
      setShowUnlinkDialog(false);
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleLinkNutritionist = async (codeToLink: string) => {
    setFeedback(null);

    if (!codeToLink || codeToLink.length !== 6) {
      setFeedback({ type: 'error', message: t('linking.invalidCodeFormat') });
      return;
    }

    try {
      setIsLoading(true);
      await clinicalApi.linkPatient({ code: codeToLink.toUpperCase() });
      setFeedback({ type: 'success', message: t('linking.success') });

      globalThis.setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 409) {
        setIsAlreadyLinked(true);
      }

      setFeedback({
        type: 'error',
        message: getPatientLinkingErrorMessage(error, t, 'link'),
      });
    } finally {
      setIsLoading(false);
      setManualCode('');
    }
  };

  const handleScannerToggle = () => {
    setIsScanning((current) => !current);
  };

  const handleScanResult = (data: string) => {
    setIsScanning(false);
    void handleLinkNutritionist(data);
  };

  return {
    profileLoading,
    manualCode,
    setManualCode,
    isScanning,
    isLoading,
    isAlreadyLinked,
    feedback,
    showUnlinkDialog,
    setShowUnlinkDialog,
    isUnlinking,
    handleBackToProfile,
    handleUnlinkNutritionist,
    handleLinkNutritionist,
    handleScannerToggle,
    handleScanResult,
  };
};
