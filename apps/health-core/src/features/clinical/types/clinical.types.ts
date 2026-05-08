export type Gender = 'MALE' | 'FEMALE';

export type ActivityLevel = 
  | 'SEDENTARY' 
  | 'LIGHTLY_ACTIVE' 
  | 'MODERATELY_ACTIVE' 
  | 'VERY_ACTIVE' 
  | 'EXTRA_ACTIVE';

export interface CreateProfilePayload {
  weightKg: number;
  heightCm: number;
  birthDate: string; 
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface HealthGoalResponse {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface WeightRecord {
  weightKg: number;
  date: string;
}

export interface ObservationResponse {
  id: string;
  patientId: string;
  nutritionistId: string;
  note: string;
  createdAt: string;
}

export interface CreateObservationRequest {
  patientId: string;
  note: string;
}