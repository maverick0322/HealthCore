import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { PostalCodeLookupResponse } from '@/features/clinical/types/clinical.types';

interface UseNutritionistPostalCodeLookupOptions {
  postalCode: string;
  getCurrentNeighborhood: () => string;
  setClinicAddress: (payload: {
    postalCode?: string;
    state?: string;
    city?: string;
    municipality?: string;
    neighborhood?: string;
  }) => void;
}

export const useNutritionistPostalCodeLookup = ({
  postalCode,
  getCurrentNeighborhood,
  setClinicAddress,
}: UseNutritionistPostalCodeLookupOptions) => {
  const { t } = useTranslation('onboarding');
  const [postalLookup, setPostalLookup] = useState<PostalCodeLookupResponse | null>(null);
  const [isPostalLookupLoading, setIsPostalLookupLoading] = useState(false);
  const [postalLookupMessage, setPostalLookupMessage] = useState<string | null>(null);
  const getCurrentNeighborhoodRef = useRef(getCurrentNeighborhood);

  useEffect(() => {
    getCurrentNeighborhoodRef.current = getCurrentNeighborhood;
  }, [getCurrentNeighborhood]);

  useEffect(() => {
    const trimmedPostalCode = postalCode.trim();

    if (trimmedPostalCode.length !== 5) {
      setPostalLookup(null);
      setPostalLookupMessage(null);
      setIsPostalLookupLoading(false);
      return;
    }

    let isActive = true;
    setIsPostalLookupLoading(true);
    setPostalLookupMessage(null);

    const timeoutId = globalThis.setTimeout(async () => {
      try {
        const lookupResult = await clinicalApi.lookupPostalCode(trimmedPostalCode);
        if (!isActive) {
          return;
        }

        const currentNeighborhood = getCurrentNeighborhoodRef.current().trim();
        const normalizedNeighborhood = lookupResult.colonies.includes(currentNeighborhood)
          ? currentNeighborhood
          : '';

        setPostalLookup(lookupResult);
        setClinicAddress({
          postalCode: lookupResult.postalCode,
          state: lookupResult.state,
          city: lookupResult.city,
          municipality: lookupResult.municipality,
          neighborhood: normalizedNeighborhood,
        });
        setPostalLookupMessage(t('nutritionist.contact.lookup.match'));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPostalLookup(null);
        const status = (error as { response?: { status?: number } })?.response?.status;
        setPostalLookupMessage(
          status === 404
            ? t('nutritionist.contact.lookup.manualFallback')
            : t('nutritionist.contact.lookup.error'),
        );
      } finally {
        if (isActive) {
          setIsPostalLookupLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      globalThis.clearTimeout(timeoutId);
    };
  }, [postalCode, setClinicAddress, t]);

  const handlePostalCodeChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 5);
    const currentPostalCode = postalCode;

    if (sanitizedValue === currentPostalCode) {
      setClinicAddress({ postalCode: sanitizedValue });
      return;
    }

    setPostalLookup(null);
    setPostalLookupMessage(null);
    setClinicAddress({
      postalCode: sanitizedValue,
      state: '',
      city: '',
      municipality: '',
      neighborhood: '',
    });
  };

  return {
    postalLookup,
    isPostalLookupLoading,
    postalLookupMessage,
    handlePostalCodeChange,
  };
};
