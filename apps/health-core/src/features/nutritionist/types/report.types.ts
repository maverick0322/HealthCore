import type { AppointmentResponse } from './agenda.types';
import type { NutritionistWeightProgressReportResponse } from '@/features/clinical/types/clinical.types';

export type NutritionistReportRangeKey = '1m' | '3m' | '6m' | '12m';

export interface NutritionistCalendarRange {
  key: NutritionistReportRangeKey;
  fromDateKey: string;
  toDateKey: string;
  fromIso: string;
  toIso: string;
}

export interface NutritionistAppointmentSummary {
  attendedCount: number;
  cancelledCount: number;
  relevantCount: number;
  attendedPercent: number;
  cancelledPercent: number;
}

export interface NutritionistReportsData {
  period: NutritionistCalendarRange;
  appointments: AppointmentResponse[];
  appointmentSummary: NutritionistAppointmentSummary;
  weightReport: NutritionistWeightProgressReportResponse;
}
