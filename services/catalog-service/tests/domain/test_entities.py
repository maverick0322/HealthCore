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

def test_micronutrients_with_negative_amount_raises_validation_error():
    # Arrange
    negative_fiber = -2.5
    
    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        NutritionalValues(
            calories=100.0,
            fiber_grams=negative_fiber
        )
        
    assert "Input should be greater than or equal to 0" in str(exc_info.value)
    assert "fiber_grams" in str(exc_info.value)

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

def test_food_item_exceeding_sub_carbohydrate_limit_raises_domain_error():
    # Arrange
    # Total carbs = 20g, but Sugars (15) + Fiber (10) = 25g. Mathematically impossible.
    impossible_carbs = NutritionalValues(
        calories=100.0,
        carbohydrates=20.0,
        sugar_grams=15.0,
        fiber_grams=10.0
    )
    
    food_item = FoodItem(
        barcode="12345",
        name="Manzana Cuántica",
        nutrition=impossible_carbs
    )
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError) as exc_info:
        food_item.validate_macronutrients()
        
    assert "Sugars and fiber combined cannot exceed total carbohydrates" in str(exc_info.value)

def test_food_item_with_valid_sub_carbohydrates_passes_validation():
    # Arrange
    # Total carbs = 20g. Sugars (10) + Fiber (5) = 15g. Valid.
    valid_carbs = NutritionalValues(
        calories=100.0,
        carbohydrates=20.0,
        sugar_grams=10.0,
        fiber_grams=5.0
    )
    
    food_item = FoodItem(
        barcode="12345",
        name="Manzana Normal",
        nutrition=valid_carbs
    )
    
    # Act & Assert
    # If the validation throws an error, the test will automatically fail. 
    # Since it shouldn't, we simply call the method.
    food_item.validate_macronutrients()