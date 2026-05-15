// Re-export shared types that the nutritionist also needs.
export type {
  AvailabilitySlotResponse,
  AppointmentResponse,
  AppointmentStatus,
  SlotOrigin,
} from '@/features/patient/types/agenda.types';

export interface GenerateSlotsRequest {
  startDate: string;   // yyyy-MM-dd
  endDate: string;     // yyyy-MM-dd
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  durationMinutes: number; // min 15
}
