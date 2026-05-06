import { useState } from 'react';
import { trackingService } from '../services/trackingService';
import type { LogFoodRequest } from '../types/tracking.types';

export const useLogFood = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const logFood = async (payload: LogFoodRequest) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      await trackingService.logFood(payload);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ocurrió un error al registrar el alimento.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { logFood, isLoading, error, isSuccess };
};