from pydantic import BaseModel, Field
from typing import Optional
from src.domain.exceptions import InvalidDomainDataError

class NutritionalValues(BaseModel):
    """
    Core value object representing macronutrients and micronutrients per 100g.
    Enforces physical invariants (nutrients cannot be negative).
    """
    # Macros
    calories: float = Field(default=0.0, ge=0.0, description="Energy in kcal")
    proteins: float = Field(default=0.0, ge=0.0, description="Proteins in grams")
    carbohydrates: float = Field(default=0.0, ge=0.0, description="Total carbs in grams")
    fats: float = Field(default=0.0, ge=0.0, description="Total fats in grams")
    
    # Micros
    fiber_grams: float = Field(default=0.0, ge=0.0, description="Dietary fiber in grams")
    sodium_mg: float = Field(default=0.0, ge=0.0, description="Sodium in milligrams")
    sugar_grams: float = Field(default=0.0, ge=0.0, description="Sugars in grams")
    potassium_mg: float = Field(default=0.0, ge=0.0, description="Potassium in milligrams")

class FoodItem(BaseModel):
    """
    Aggregate root for the Food Catalog domain.
    """
    barcode: str = Field(..., min_length=1, description="Unique EAN/UPC product identifier")
    name: str = Field(..., min_length=1, description="Commercial product name")
    brand: Optional[str] = Field(default="Generic", description="Manufacturer or brand")
    image_url: Optional[str] = Field(default=None, description="Public URL to the product packaging image")
    nutrition: NutritionalValues

    def validate_macronutrients(self) -> None:
        """
        Validates cross-field rules that Field() parameters cannot handle natively.
        Ensures mathematical and physical consistency of the nutritional profile.
        """
        n = self.nutrition
        
        # Rule 1: A 100g physical product cannot contain more than 100g of pure macronutrients
        total_macros = n.proteins + n.carbohydrates + n.fats
        if total_macros > 100.0:
            raise InvalidDomainDataError("Total macronutrients exceed physical limit per 100g.")
        
        # Rule 2: Sub-components cannot exceed their parent components
        total_sub_carbs = n.sugar_grams + n.fiber_grams
        
        # We allow a small tolerance (0.1g) due to rounding discrepancies in 3rd party APIs
        FLOAT_TOLERANCE = 0.1 
        if (total_sub_carbs - n.carbohydrates) > FLOAT_TOLERANCE:
            raise InvalidDomainDataError("Sugars and fiber combined cannot exceed total carbohydrates.")