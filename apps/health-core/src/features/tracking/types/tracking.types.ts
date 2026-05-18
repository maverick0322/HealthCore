export interface SelectedFoodItem {
  barcode: string;
  name: string;
  baseCalories: number;
  grams: number; // Starting on 100 g or 150 g, user adjusts it
}

export interface LogFoodItemCommand {
  barcode: string;
  grams: number;
}

export interface LogFoodRequest {
  mealType: string;
  consumedAt: string; // ISO-8601 format (e.g., 2026-05-05T08:30:00Z)
  photoKey?: string;  
  foods: LogFoodItemCommand[];
}

export interface LogFoodResponse {
  status: string;
  message: string;
  data: any;
}

// --- DTOs for Dashboard and Historical Analysis (CQRS Read-Side) ---

export interface TodayDashboardSummary {
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  totalWaterMl: number;
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