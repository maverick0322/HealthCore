from pydantic import BaseModel, Field
from typing import Optional

class NutritionalValues(BaseModel):
    """Modelo para los macronutrientes base (por cada 100g)"""
    calories: float = Field(default=0.0, description="Calorías (kcal)")
    proteins: float = Field(default=0.0, description="Proteínas (g)")
    carbohydrates: float = Field(default=0.0, description="Carbohidratos totales (g)")
    fats: float = Field(default=0.0, description="Grasas totales (g)")

class FoodItem(BaseModel):
    """Entidad principal de nuestro catálogo de alimentos"""
    barcode: str = Field(..., description="Código de barras único del producto")
    name: str = Field(..., description="Nombre comercial del producto")
    brand: Optional[str] = Field(default=None, description="Marca del producto (puede ser nulo)")
    image_url: Optional[str] = Field(default=None, description="URL de la foto del producto")
    nutrition: NutritionalValues