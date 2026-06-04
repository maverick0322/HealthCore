import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logClientError } from '@/core/utils/logger';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

export const useNutritionistGenerateQrPage = () => {
  const navigate = useNavigate();

  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);

  const applyLinkingCodeState = (nextCode: string, expiresInSeconds: number) => {
    const safeSeconds = Math.max(expiresInSeconds, 0);
    setCode(nextCode);
    setExpiresAt(Date.now() + safeSeconds * 1000);
    setTimeLeft(safeSeconds);
    setIsExpired(false);
  };

  const generateNewCode = async () => {
    try {
      setIsLoading(true);
      setShowExpiredDialog(false);
      setIsExpired(false);
      const data = await clinicalApi.generateLinkingCode();
      applyLinkingCodeState(data.code, data.expiresInSeconds);
    } catch (error) {
      logClientError('NutritionistGenerateQrPage.generateNewCode.error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrGenerateCode = async () => {
    try {
      setIsLoading(true);
      const currentData = await clinicalApi.getCurrentLinkingCode();

      if (currentData && currentData.expiresInSeconds > 0) {
        applyLinkingCodeState(currentData.code, currentData.expiresInSeconds);
      } else {
        await generateNewCode();
      }
    } catch (error) {
      logClientError('NutritionistGenerateQrPage.loadOrGenerateCode.error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrGenerateCode();
  }, []);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const updateTimeLeft = () => {
      const nextTimeLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft === 0) {
        setExpiresAt(null);
        setCode(null);
        setIsExpired(true);
        setShowExpiredDialog(true);
      }
    };

    updateTimeLeft();
    const timer = globalThis.setInterval(updateTimeLeft, 1000);

    return () => globalThis.clearInterval(timer);
  }, [expiresAt]);

  const handleBackToPatients = () => {
    navigate('/patients/nutritionist');
  };

  return {
    code,
    timeLeft,
    isLoading,
    isExpired,
    showExpiredDialog,
    setShowExpiredDialog,
    generateNewCode,
    handleBackToPatients,
  };
};
