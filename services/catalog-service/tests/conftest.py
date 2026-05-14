import pytest
from src.domain.entities import FoodItem, NutritionalValues

@pytest.fixture
def valid_nutritional_values():
    """Provee un objeto de valores nutricionales válido (incluyendo los nuevos micronutrientes)."""
    return NutritionalValues(
        calories=472.0,
        proteins=5.0,
        carbohydrates=68.0,
        fats=20.0,
        fiber_grams=2.0,
        sodium_mg=400.0,
        sugar_grams=38.0,
        potassium_mg=150.0
    )

@pytest.fixture
def valid_food_item(valid_nutritional_values):
    """Provee una entidad FoodItem de dominio 100% válida para ser usada en todas las pruebas."""
    return FoodItem(
        barcode="7622300336738",
        name="Oreo Original",
        brand="Nabisco",
        image_url="http://example.com/oreo.jpg",
        nutrition=valid_nutritional_values
    )