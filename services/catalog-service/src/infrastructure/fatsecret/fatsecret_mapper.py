import logging
import re
from typing import Dict, Any, Optional
from src.domain.entities import FoodItem, NutritionalValues

logger = logging.getLogger(__name__)

class FatSecretMapper:
    """
    Translates raw provider JSON dictionaries into strict Domain Entities.
    Why: Keeps data validation and transformation separate from network logic.
    """
    def map_to_domain(self, item: Dict[str, Any], barcode: Optional[str] = None) -> Optional[FoodItem]:
        try:
            food_name = item.get("food_name")
            if not food_name:
                return None
                
            serving = self._extract_standard_serving(item)
            
            if serving:
                nutrition = NutritionalValues(
                    calories=self._parse_float(serving, "calories"),
                    proteins=self._parse_float(serving, "protein"),
                    carbohydrates=self._parse_float(serving, "carbohydrate"),
                    fats=self._parse_float(serving, "fat"),
                    fiber_grams=self._parse_float(serving, "fiber"),
                    sodium_mg=self._parse_float(serving, "sodium"),
                    sugar_grams=self._parse_float(serving, "sugar"),
                    potassium_mg=self._parse_float(serving, "potassium")
                )
            elif "food_description" in item:
                nutrition = self._parse_from_description(item["food_description"])
            else:
                return None

            return FoodItem(
                barcode=barcode or str(item.get("food_id", "UNKNOWN")),
                name=str(food_name),
                brand=str(item.get("brand_name", "Generic")),
                image_url=str(item.get("food_url", "")),
                nutrition=nutrition
            )
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(f"FatSecret schema mismatch during mapping: {e}")
            return None

    def _extract_standard_serving(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Isolates the logic to find the correct serving array/dict."""
        servings = item.get("servings", {}).get("serving", [])
        if isinstance(servings, list) and len(servings) > 0:
            return servings[0]
        elif isinstance(servings, dict):
            return servings
        return None

    def _parse_float(self, data: Dict[str, Any], key: str) -> float:
        """Safely casts string numerics from the payload."""
        val = data.get(key)
        try:
            return float(val) if val is not None else 0.0
        except (ValueError, TypeError):
            return 0.0

    def _parse_from_description(self, description: str) -> NutritionalValues:
        """Extracts basic macros from the raw description string using regex."""
        return NutritionalValues(
            calories=self._extract_regex(r'Calories:\s*([\d.]+)', description),
            fats=self._extract_regex(r'Fat:\s*([\d.]+)', description),
            carbohydrates=self._extract_regex(r'Carbs:\s*([\d.]+)', description),
            proteins=self._extract_regex(r'Protein:\s*([\d.]+)', description),
            fiber_grams=0.0, 
            sodium_mg=0.0,
            sugar_grams=0.0,
            potassium_mg=0.0
        )

    def _extract_regex(self, pattern: str, text: str) -> float:
        """Helper to run a regex search and return a float safely."""
        match = re.search(pattern, text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return 0.0
        return 0.0