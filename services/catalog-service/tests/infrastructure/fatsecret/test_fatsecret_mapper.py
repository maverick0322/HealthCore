import pytest
from pydantic import ValidationError
from src.infrastructure.fatsecret.fatsecret_mapper import FatSecretMapper
from src.domain.entities import FoodItem

# --- Fixtures ---

@pytest.fixture
def mapper():
    return FatSecretMapper()

@pytest.fixture
def raw_fatsecret_json_list():
    """Simulates a standard FatSecret response where 'serving' is a list."""
    return {
        "food_id": "12345",
        "food_name": "Avena Integral",
        "brand_name": "Quaker",
        "food_url": "http://fatsecret.com/avena",
        "servings": {
            "serving": [
                {
                    "calories": "350",
                    "protein": "14",
                    "carbohydrate": "60",
                    "fat": "5.5",
                    "fiber": "10",
                    "sodium": "5",
                    "sugar": "1",
                    "potassium": "350"
                },
                {
                    # A secondary serving (e.g., per 1 cup) that should be ignored by our mapper
                    "calories": "150" 
                }
            ]
        }
    }

@pytest.fixture
def raw_fatsecret_json_dict():
    """Simulates a FatSecret response where 'serving' is a single dictionary."""
    return {
        "food_id": "99999",
        "food_name": "Manzana",
        "brand_name": "",
        "servings": {
            "serving": {
                "calories": "52",
                "carbohydrate": "14",
                "sugar": "10.4"
            }
        }
    }

# ==========================================
# TESTS FOR: map_to_domain (Happy Paths)
# ==========================================

def test_map_to_domain_with_list_serving_returns_valid_food_item(mapper, raw_fatsecret_json_list):
    # Arrange
    barcode = "777888999"
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_list, barcode)
    
    # Assert
    assert isinstance(result, FoodItem)
    assert result.barcode == barcode
    assert result.name == "Avena Integral"
    assert result.brand == "Quaker"
    assert result.image_url == "http://fatsecret.com/avena"
    
    # Asserting deep nutritional parsing
    assert result.nutrition.calories == 350.0
    assert result.nutrition.proteins == 14.0
    assert result.nutrition.fats == 5.5
    assert result.nutrition.fiber_grams == 10.0

def test_map_to_domain_with_dict_serving_returns_valid_food_item(mapper, raw_fatsecret_json_dict):
    # Arrange
    barcode = "111222"
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_dict, barcode)
    
    # Assert
    assert isinstance(result, FoodItem)
    assert result.name == "Manzana"
    assert result.nutrition.calories == 52.0
    assert result.nutrition.carbohydrates == 14.0
    # Missing fields in the raw JSON should default to 0.0
    assert result.nutrition.proteins == 0.0 

def test_map_to_domain_without_barcode_falls_back_to_food_id(mapper, raw_fatsecret_json_list):
    # Arrange
    # No barcode provided in parameters
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_list, barcode=None)
    
    # Assert
    assert result.barcode == "12345"  # Matches the 'food_id' in the fixture

# ==========================================
# TESTS FOR: map_to_domain (Error Paths)
# ==========================================

def test_map_to_domain_missing_food_name_returns_none(mapper, raw_fatsecret_json_list):
    # Arrange
    del raw_fatsecret_json_list["food_name"]
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_list)
    
    # Assert
    assert result is None

def test_map_to_domain_missing_servings_returns_none(mapper, raw_fatsecret_json_list):
    # Arrange
    del raw_fatsecret_json_list["servings"]
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_list)
    
    # Assert
    assert result is None

def test_map_to_domain_catches_pydantic_validation_error_and_returns_none(mapper, raw_fatsecret_json_list):
    # Arrange
    # Inject an impossible physical value to trigger our Domain validation (ValidationError -> ValueError)
    raw_fatsecret_json_list["servings"]["serving"][0]["calories"] = "-500"
    
    # Act
    result = mapper.map_to_domain(raw_fatsecret_json_list)
    
    # Assert
    assert result is None

# ==========================================
# TESTS FOR: _parse_float (Internal Helper)
# ==========================================

def test_parse_float_with_valid_string_returns_float(mapper):
    # Arrange
    data = {"key": "12.5"}
    
    # Act
    result = mapper._parse_float(data, "key")
    
    # Assert
    assert result == 12.5

def test_parse_float_with_valid_integer_returns_float(mapper):
    # Arrange
    data = {"key": 42}
    
    # Act
    result = mapper._parse_float(data, "key")
    
    # Assert
    assert result == 42.0

def test_parse_float_with_missing_key_returns_zero(mapper):
    # Arrange
    data = {"other_key": "10"}
    
    # Act
    result = mapper._parse_float(data, "missing_key")
    
    # Assert
    assert result == 0.0

def test_parse_float_with_invalid_string_returns_zero(mapper):
    # Arrange
    data = {"key": "not_a_number"}
    
    # Act
    result = mapper._parse_float(data, "key")
    
    # Assert
    assert result == 0.0

def test_parse_float_with_invalid_type_returns_zero(mapper):
    # Arrange
    data = {"key": ["list", "instead", "of", "scalar"]}
    
    # Act
    result = mapper._parse_float(data, "key")
    
    # Assert
    assert result == 0.0