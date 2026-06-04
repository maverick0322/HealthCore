// Re-export shared types that the nutritionist also needs.
export type {
  AvailabilitySlotResponse,
  AppointmentResponse,
  AppointmentStatus,
  SlotOrigin,
} from '@/features/patient/types/agenda.types';

export interface GenerateSlotsTimeBlock {
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
}

export interface GenerateSlotsDay {
  date: string;        // yyyy-MM-dd
  blocks: GenerateSlotsTimeBlock[];
}

export interface GenerateSlotsRequest {
  timeZone?: string;   // IANA, for example America/Mexico_City
  durationMinutes: number; // min 15
  days?: GenerateSlotsDay[];

  // Legacy shape kept while older clients migrate.
  startDate?: string;   // yyyy-MM-dd
  endDate?: string;     // yyyy-MM-dd
  startTime?: string;   // HH:mm
  endTime?: string;     // HH:mm
}

export interface CreateNutritionistAppointmentRequest {
  slotId: string;
  slotVersion: number;
  patientId: string;
  locale?: string;
}
