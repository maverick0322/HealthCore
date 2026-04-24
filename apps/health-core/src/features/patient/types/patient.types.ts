// Domain types for the patient profile feature.
// Mirrors the data returned by the identity-service / profile-service contracts.

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTRA_ACTIVE";

export type Goal =
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "HEALTH"
  | "PERFORMANCE";

export type DietType =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "keto"
  | "paleo";

export type Allergy = "gluten" | "lactose" | "nuts" | "seafood" | "egg";

/** Physical / health data collected during onboarding. */
export interface PatientPhysicalData {
  age: number;
  heightCm: number;
  weightKg: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

/** Nutritional preferences collected during onboarding. */
export interface PatientPreferences {
  dietType: DietType;
  allergies: Allergy[];
  avoidFoods: string[];
}

/**
 * Full patient profile aggregated from auth store + onboarding store.
 * Fields may be undefined when onboarding has not been completed yet.
 */
export interface PatientProfile {
  // Identity fields
  id?: string;
  name?: string;
  email?: string;
  provider?: string;
  emailVerified?: boolean;
  createdAt?: string;

  // Health fields (from onboarding)
  physicalData?: PatientPhysicalData;
  mainGoal?: Goal;
  preferences?: PatientPreferences;
}
