import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';
import type { AppointmentResponse } from '@/features/nutritionist/types/agenda.types';

export interface NutritionistPatientCardViewModel {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  lastVisit: string;
  goal: string;
  futureAppointments: number;
  nextAppointmentAt: string | null;
}

export const getDisplayIdentity = (userId: string): string => {
  const normalized = userId.trim();
  if (!normalized) {
    return 'Paciente';
  }
  return normalized;
};

export const toPatientCardViewModel = (
  patient: NutritionistPatientProfileResponse,
  futureAppointments: AppointmentResponse[],
  goalLabel: string,
  lastVisitPlaceholder: string,
): NutritionistPatientCardViewModel => ({
  id: patient.userId,
  name: patient.fullName?.trim() || getDisplayIdentity(patient.userId),
  profilePhotoUrl: patient.profilePhotoUrl,
  lastVisit: futureAppointments[0]?.startTime ?? lastVisitPlaceholder,
  goal: goalLabel,
  futureAppointments: futureAppointments.length,
  nextAppointmentAt: futureAppointments[0]?.startTime ?? null,
});
