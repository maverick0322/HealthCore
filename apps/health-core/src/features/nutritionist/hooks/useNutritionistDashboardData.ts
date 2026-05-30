import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { useNutritionistAppointments } from '@/features/nutritionist/hooks/useNutritionistAppointments';
import {
  addDays,
  getDateRangeForDateKeys,
  localDateKeyFromIso,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';

const getFirstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] ?? null;

export const useNutritionistDashboardData = () => {
  const { t } = useTranslation(['nutritionist', 'onboarding']);
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
  } = useNutritionistAppointments();

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profile = await clinicalApi.getMyNutritionistProfile();
        if (!ignore) {
          setDisplayName(getFirstName(profile.fullName));
        }
      } catch {
        if (!ignore) {
          setDisplayName(null);
        }
      } finally {
        if (!ignore) {
          setProfileLoading(false);
        }
      }
    };

    const loadPatients = async () => {
      setPatientsLoading(true);
      setPatientsError(null);
      try {
        const linkedPatients = await clinicalApi.getNutritionistPatients();
        if (!ignore) {
          setPatients(linkedPatients);
        }
      } catch {
        if (!ignore) {
          setPatients([]);
          setPatientsError(t('patients.error'));
        }
      } finally {
        if (!ignore) {
          setPatientsLoading(false);
        }
      }
    };

    void loadProfile();
    void loadPatients();

    return () => {
      ignore = true;
    };
  }, [t]);

  useEffect(() => {
    const today = todayDateKey();
    const range = getDateRangeForDateKeys(today, addDays(today, 14));
    void fetchAppointments(range.from, range.to);
  }, [fetchAppointments]);

  const patientNameById = useMemo(
    () =>
      new Map(
        patients.map((patient) => [
          patient.userId,
          patient.fullName?.trim() || t('dashboard.unknownPatient'),
        ]),
      ),
    [patients, t],
  );

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((appointment) => appointment.status !== 'CANCELLED')
      .filter((appointment) => new Date(appointment.endTime).getTime() >= now)
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      );
  }, [appointments]);

  const today = todayDateKey();
  const appointmentsToday = appointments.filter(
    (appointment) =>
      appointment.status !== 'CANCELLED' &&
      localDateKeyFromIso(appointment.startTime) === today,
  ).length;
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === 'PENDING',
  ).length;
  const patientPreview = patients.slice(0, 5);

  return {
    profileLoading,
    displayName,
    patients,
    patientsLoading,
    patientsError,
    appointments,
    appointmentsLoading,
    appointmentsError,
    patientNameById,
    upcomingAppointments,
    appointmentsToday,
    pendingAppointments,
    patientPreview,
  };
};
