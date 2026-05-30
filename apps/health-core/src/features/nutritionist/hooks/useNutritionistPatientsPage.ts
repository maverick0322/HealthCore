import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import { nutritionistAgendaService } from '@/features/nutritionist/services/nutritionistAgendaService';
import type { AppointmentResponse } from '@/features/nutritionist/types/agenda.types';
import { formatPatientGoalLabel } from '@/features/onboarding/utils/profilePresentation';
import {
  toPatientCardViewModel,
} from '@/features/nutritionist/utils/patientCards';

export const useNutritionistPatientsPage = () => {
  const { t } = useTranslation(['nutritionist', 'onboarding']);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<NutritionistPatientProfileResponse[]>([]);
  const [futureAppointments, setFutureAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const now = new Date();
        const to = new Date(now);
        to.setDate(to.getDate() + 90);
        const patientResponse = await clinicalApi.getNutritionistPatients();

        let appointmentResponse: AppointmentResponse[] = [];
        try {
          appointmentResponse = await nutritionistAgendaService.getMyAppointments(
            now.toISOString(),
            to.toISOString(),
          );
        } catch (error) {
          if (!(axios.isAxiosError(error) && error.response?.status === 404)) {
            console.error('Error loading nutritionist appointments:', error);
          }
        }

        setPatients(patientResponse);
        setFutureAppointments(
          appointmentResponse
            .filter(
              (appointment) =>
                appointment.status !== 'CANCELLED' &&
                appointment.status !== 'ATTENDED' &&
                new Date(appointment.startTime).getTime() > now.getTime(),
            )
            .sort(
              (left, right) =>
                new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
            ),
        );
      } catch (error) {
        console.error('Error loading nutritionist patients:', error);
        setLoadError(t('patients.error'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatients();
  }, [t]);

  const patientCards = useMemo(() => {
    const appointmentsByPatient = new Map<string, AppointmentResponse[]>();
    futureAppointments.forEach((appointment) => {
      const current = appointmentsByPatient.get(appointment.patientId) ?? [];
      current.push(appointment);
      appointmentsByPatient.set(appointment.patientId, current);
    });

    return patients.map((patient) =>
      toPatientCardViewModel(
        patient,
        appointmentsByPatient.get(patient.userId) ?? [],
        formatPatientGoalLabel(t, patient.goal),
        t('patients.lastVisitPlaceholder'),
      ),
    );
  }, [futureAppointments, patients, t]);

  const filteredPatients = useMemo(
    () =>
      patientCards.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [patientCards, searchTerm],
  );

  return {
    searchTerm,
    setSearchTerm,
    patientCards,
    filteredPatients,
    isLoading,
    loadError,
  };
};
