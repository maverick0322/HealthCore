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