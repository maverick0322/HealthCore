from pydantic import BaseModel, Field
from typing import Optional
from src.domain.exceptions import InvalidDomainDataError

class NutritionalValues(BaseModel):
    """
    Core value object representing macronutrients per 100g.
    Enforces physical invariants (nutrients cannot be negative).
    """
    calories: float = Field(default=0.0, ge=0.0, description="Energy in kcal")
    proteins: float = Field(default=0.0, ge=0.0, description="Proteins in grams")
    carbohydrates: float = Field(default=0.0, ge=0.0, description="Total carbs in grams")
    fats: float = Field(default=0.0, ge=0.0, description="Total fats in grams")

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
        """
        # A 100g physical product cannot contain more than 100g of pure macronutrients
        total_macros = self.nutrition.proteins + self.nutrition.carbohydrates + self.nutrition.fats
        if total_macros > 100.0:
            raise InvalidDomainDataError("Total macronutrients exceed physical limit per 100g.")