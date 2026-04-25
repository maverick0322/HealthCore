export interface FoodNutrients {
  name: string;
  brand: string;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  source: string;
}

export interface LogFoodRequest {
  barcode: string;
  grams: number;
  // mealType: string; // Nota: Agrégalo a tu DTO de Java si decides guardarlo
}

export interface LogFoodResponse {
  status: string;
  message: string;
  data: any;
}