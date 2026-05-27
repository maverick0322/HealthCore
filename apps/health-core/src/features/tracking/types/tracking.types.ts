// --- DTOs for Food Logging (Write-Side) ---

export interface SelectedFoodItem {
  barcode: string;
  name: string;
  baseCalories: number;
  grams: number; // Defaults to a standard portion (e.g., 100g), adjustable by the user
}

export interface LogFoodItemCommand {
  barcode: string;
  grams: number;
}

export interface LogFoodRequest {
  mealName: string;
  mealType: string;
  consumedAt: string; // ISO-8601 format strictly required (e.g., 2026-05-05T08:30:00Z)
  photoKey?: string;  // Cloudflare R2 secure storage key
  foods: LogFoodItemCommand[];
}

/**
 * Generic API response wrapper.
 * Design Decision: Replaced 'any' with a generic type 'T' (defaulting to unknown) 
 * to enforce strict typing on API responses and prevent silent runtime errors.
 */
export interface LogFoodResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

// --- DTOs for Daily Meal Logs (CQRS Read-Side) ---

export interface MealLogItemDTO {
  barcode: string;
  foodName: string;    
  consumedGrams: number; 
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiberGrams: number;
  sodiumMg: number;
  sugarGrams: number;
  potassiumMg: number;
}

export interface MealLogDTO {
  id: string;
  userId: string;
  mealName: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  consumedAt: string;
  photoKey: string | null;
  items: MealLogItemDTO[];
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
}

// --- DTOs for Dashboard and Historical Analysis (CQRS Read-Side) ---

export interface TodayDashboardSummary {
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  totalWaterMl: number;
  currentStreak: number;
  bestStreak: number;
}

export interface DailyMacroSummary {
  date: string; // ISO-8601 format YYYY-MM-DD
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
}

// --- DTOs for Water Logging (Write-Side) ---

export interface LogWaterRequest {
  amountMl: number;
  consumedAt?: string; // ISO-8601 format (optional, backend assigns current date if null)
}

export interface WaterLogResponse {
  id: string;
  userId: string;
  amountMl: number;
  consumedAt: string;
}
