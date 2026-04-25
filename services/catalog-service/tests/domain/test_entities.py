import pytest
from pydantic import ValidationError
from src.domain.entities import FoodItem, NutritionalValues
from src.domain.exceptions import InvalidDomainDataError



def test_nutritional_values_with_negative_amount_raises_validation_error():
    # Arrange
    negative_calories = -15.0
    
    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        NutritionalValues(
            calories=negative_calories, 
            proteins=5.0, 
            carbohydrates=10.0, 
            fats=2.0
        )
        
    # Specific Asserts
    assert "Input should be greater than or equal to 0" in str(exc_info.value)
    assert "calories" in str(exc_info.value)


def test_create_food_item_with_valid_data_succeeds(valid_food_item):
    # Arrange & Act: Using the valid_food_item fixture, which already creates a FoodItem with valid data
    
    # Assert:
    assert valid_food_item.barcode == "7622300336738"
    assert valid_food_item.name == "Oreo Original"
    assert valid_food_item.brand == "Nabisco"
    assert valid_food_item.nutrition.calories == pytest.approx(472.0)


def test_food_item_with_empty_barcode_raises_validation_error(valid_nutritional_values):
    # Arrange
    empty_barcode = ""
    
    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        FoodItem(
            barcode=empty_barcode,
            name="Galletas válidas",
            nutrition=valid_nutritional_values
        )
        
    assert "String should have at least 1 character" in str(exc_info.value)
    assert "barcode" in str(exc_info.value)


def test_food_item_exceeding_physical_macronutrient_limit_raises_domain_error():
    # Arrange
    impossible_nutrition = NutritionalValues(
        calories=600.0,
        proteins=50.0,
        carbohydrates=40.0,
        fats=20.0
    )
    
    food_item = FoodItem(
        barcode="12345",
        name="Barra de Proteína Mutante",
        nutrition=impossible_nutrition
    )
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError) as exc_info:
        food_item.validate_macronutrients()
        
    assert "Total macronutrients exceed physical limit" in str(exc_info.value)