export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';

export type SlotOrigin = 'PREDEFINED' | 'CUSTOM';

export interface AvailabilitySlotResponse {
  id: string;
  nutritionistId: string;
  startTime: string;   // ISO 8601 date-time
  endTime: string;     // ISO 8601 date-time
  origin: SlotOrigin;
  version: number;
  reserved: boolean;
  active: boolean;
}

export interface AppointmentResponse {
  id: string;
  slotId: string;
  nutritionistId: string;
  patientId: string;
  startTime: string;   // ISO 8601 date-time
  endTime: string;     // ISO 8601 date-time
  status: AppointmentStatus;
  version: number;
}

export interface CreateAppointmentRequest {
  slotId: string;
  nutritionistId: string;
  slotVersion: number;
  locale?: string;
}

export interface RescheduleAppointmentRequest {
  newSlotId: string;
  newSlotVersion: number;
  locale?: string;
}
