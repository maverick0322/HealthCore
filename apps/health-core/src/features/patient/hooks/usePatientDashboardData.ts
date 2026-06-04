import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionistProfileResponse,
  PatientProfileResponse,
} from '@/features/clinical/types/clinical.types';
import { usePatientAppointments } from '@/features/patient/hooks/usePatientAppointments';
import {
  formatConsultationTypeLabel,
  formatNutritionistSpecializationLabel,
} from '@/features/onboarding/utils/profilePresentation';

const getFirstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] ?? null;

const getNutritionistSpecialtyChips = (
  t: TFunction,
  profile: NutritionistProfileResponse | null,
) => {
  if (!profile) {
    return [];
  }

  return profile.specializations.slice(0, 3).map((specialization) =>
    specialization === 'OTHER' && profile.customSpecialization
      ? profile.customSpecialization
      : formatNutritionistSpecializationLabel(t, specialization),
  );
};

export const usePatientDashboardData = () => {
  const { t } = useTranslation('patient');
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [nutritionistProfile, setNutritionistProfile] =
    useState<NutritionistProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
  } = usePatientAppointments();

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const loadProfile = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) {
        setProfileLoading(true);
      }
      setProfileError(null);

      try {
        const patientProfile = await clinicalApi.getMyProfile();
        setProfile(patientProfile);

        if (patientProfile.nutritionistId?.trim()) {
          try {
            const linkedProfile = await clinicalApi.getMyLinkedNutritionistProfile();
            setNutritionistProfile(linkedProfile);
          } catch {
            setNutritionistProfile(null);
          }
        } else {
          setNutritionistProfile(null);
        }
      } catch {
        setProfile(null);
        setNutritionistProfile(null);
        setProfileError(t('dashboard.profileLoadError'));
      } finally {
        if (showLoading) {
          setProfileLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleWindowRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadProfile({ showLoading: false });
      }
    };

    globalThis.addEventListener('focus', handleWindowRefresh);
    document.addEventListener('visibilitychange', handleWindowRefresh);

    return () => {
      globalThis.removeEventListener('focus', handleWindowRefresh);
      document.removeEventListener('visibilitychange', handleWindowRefresh);
    };
  }, [loadProfile]);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return (
      appointments
        .filter((appointment) => appointment.status !== 'CANCELLED')
        .filter((appointment) => new Date(appointment.endTime).getTime() >= now)
        .sort(
          (left, right) =>
            new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
        )[0] ?? null
    );
  }, [appointments]);

  const displayName = profile?.firstName?.trim() || getFirstName(profile?.fullName) || null;

  const nutritionistName =
    nutritionistProfile?.fullName?.trim() || t('dashboard.assignedNutritionist');
  const specialtyChips = getNutritionistSpecialtyChips(t, nutritionistProfile);
  const consultationChips =
    nutritionistProfile?.consultationTypes
      .slice(0, 2)
      .map((type) => formatConsultationTypeLabel(t, type)) ?? [];

  return {
    profile,
    nutritionistProfile,
    profileLoading,
    profileError,
    appointmentsLoading,
    appointmentsError,
    nextAppointment,
    displayName,
    nutritionistName,
    specialtyChips,
    consultationChips,
    loadProfile,
  };
};
