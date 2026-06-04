import { useEffect, useRef, useState } from 'react';

import { useLogFood } from '@/features/tracking/hooks/useLogFood';
import type { LogFoodRequest } from '@/features/tracking/types/tracking.types';

interface QuickTrackIngredient {
  barcode?: string;
  name?: string;
  baseCaloriesPer100Units?: number;
  calories?: number;
  quantityAmount?: number;
}

interface QuickTrackPayload {
  mealSlot: string;
  optionName: string;
  ingredients: unknown[];
}

export const usePatientPlanQuickTrack = () => {
  const { logFood, isLoading: isLoggingFood, error: logError, isSuccess: logSuccess } = useLogFood();
  const [quickTrackFeedback, setQuickTrackFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        globalThis.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!logSuccess) {
      return;
    }

    setQuickTrackFeedback({
      type: 'success',
      message: '\u00a1Platillo registrado en tu diario exitosamente!',
    });

    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = globalThis.setTimeout(() => {
      setQuickTrackFeedback(null);
      timeoutRef.current = null;
    }, 5000);
  }, [logSuccess]);

  useEffect(() => {
    if (!logError) {
      return;
    }

    setQuickTrackFeedback({ type: 'error', message: logError });

    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = globalThis.setTimeout(() => {
      setQuickTrackFeedback(null);
      timeoutRef.current = null;
    }, 5000);
  }, [logError]);

  const handleQuickTrack = async (payload: QuickTrackPayload) => {
    const foods = payload.ingredients.map((item) => {
      const ingredient = item as QuickTrackIngredient;

      return {
        barcode: ingredient.barcode ?? '',
        name: ingredient.name ?? '',
        baseCalories: ingredient.baseCaloriesPer100Units || ingredient.calories,
        grams: ingredient.quantityAmount ?? 0,
      };
    });

    await logFood({
      mealName: payload.optionName,
      mealType: payload.mealSlot,
      consumedAt: new Date().toISOString(),
      foods: foods as unknown as LogFoodRequest['foods'],
    });
  };

  return {
    quickTrackFeedback,
    isLoggingFood,
    handleQuickTrack,
  };
};
