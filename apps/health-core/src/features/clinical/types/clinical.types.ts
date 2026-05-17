export type Gender = 'MALE' | 'FEMALE';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type PatientGoal = 'weight-loss' | 'muscle-gain' | 'health' | 'performance';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';

export type Allergy = 'gluten' | 'lactose' | 'nuts' | 'seafood' | 'egg';

export type NutritionistSpecialization =
  | 'CLINICAL'
  | 'SPORTS'
  | 'PEDIATRIC'
  | 'GERIATRIC'
  | 'FOOD_SAFETY'
  | 'PERINATAL'
  | 'FOOD_TECHNOLOGY'
  | 'OTHER';

export type ConsultationType = 'PRESENTIAL' | 'ONLINE' | 'HOME_VISIT';

export interface CreateProfilePayload {
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string | null;
  weightKg: number;
  heightCm: number;
  birthDate: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: PatientGoal;
  dietType: DietType;
  allergies: Allergy[];
  excludedFoods: string[];
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

export interface PatientProfileResponse extends CreateProfilePayload {
  userId: string;
  fullName: string | null;
  nutritionistId?: string | null;
  profileCompleted: boolean;
}

export interface ClinicAddressPayload {
  postalCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
}

export interface NutritionistProfilePayload {
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string | null;
  specializations: NutritionistSpecialization[];
  customSpecialization?: string | null;
  professionalLicense: string;
  consultationTypes: ConsultationType[];
  phone?: string | null;
  clinicAddress?: ClinicAddressPayload | null;
  bio: string;
}

export interface NutritionistProfileResponse extends NutritionistProfilePayload {
  userId: string;
  fullName: string | null;
  profileCompleted: boolean;
}

export interface NutritionistPatientProfileResponse extends PatientProfileResponse {}
