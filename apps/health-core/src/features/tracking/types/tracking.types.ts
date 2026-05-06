// Información visual para mantener en el "carrito" del frontend
export interface SelectedFoodItem {
  barcode: string;
  name: string;
  baseCalories: number;
  grams: number; // Por defecto empezará en 100g o 150g, el usuario lo ajustará
}

// El payload exacto que espera tu controlador de Spring Boot
export interface LogFoodItemCommand {
  barcode: string;
  grams: number;
}

export interface LogFoodRequest {
  mealType: string;
  consumedAt: string; // Formato ISO-8601 (ej. 2026-05-05T08:30:00Z)
  photoKey?: string;  // Opcional, por si deciden no tomar foto
  foods: LogFoodItemCommand[];
}

export interface LogFoodResponse {
  status: string;
  message: string;
  data: any;
}