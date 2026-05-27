import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { ClinicAddressPayload, NutritionistProfileResponse } from '@/features/clinical/types/clinical.types';
import { formatNutritionistSpecializationLabel } from '@/features/onboarding/utils/profilePresentation';

export const formatAddress = (address?: ClinicAddressPayload | null) => {
  if (!address) {
    return null;
  }

  const parts = [
    [address.street?.trim(), address.exteriorNumber?.trim()].filter(Boolean).join(' '),
    address.interiorNumber?.trim() ? `Int. ${address.interiorNumber.trim()}` : null,
    address.neighborhood?.trim(),
    address.municipality?.trim(),
    address.city?.trim() && address.city?.trim() !== address.municipality?.trim() ? address.city.trim() : null,
    address.state?.trim(),
    address.postalCode?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
};

export const useNutritionistProfile = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const [profile, setProfile] = useState<NutritionistProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await clinicalApi.getMyNutritionistProfile();
        setProfile(response);
      } catch {
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const specializationSummary = useMemo(() => {
    if (!profile?.specializations.length) {
      return t('profile.pendingProfile');
    }

    return profile.specializations.map((item) => formatNutritionistSpecializationLabel(t, item)).join(', ');
  }, [profile?.specializations, t]);

  return {
    profile,
    setProfile,
    isLoadingProfile,
    user,
    navigate,
    handleLogout,
    specializationSummary,
  };
};
