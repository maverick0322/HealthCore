import pytest
from unittest.mock import MagicMock
from pymongo.errors import PyMongoError, ConnectionFailure, OperationFailure

from src.infrastructure.mongo_local_adapter import MongoLocalCatalogAdapter
from src.domain.entities import FoodItem

# --- Fixtures ---

@pytest.fixture
def mock_collection():
    """Mock for the PyMongo Collection to prevent real database calls."""
    return MagicMock()

@pytest.fixture
def mongo_adapter(mock_collection):
    """SUT (System Under Test) injected with the mocked collection."""
    return MongoLocalCatalogAdapter(collection=mock_collection)

@pytest.fixture
def valid_bson_document():
    """Simulates a raw document returned by PyMongo."""
    return {
        "_id": "dummy_object_id_123",
        "barcode": "7622300336738",
        "name": "Oreo Original",
        "brand": "Nabisco",
        "image_url": "http://example.com/oreo.jpg",
        "nutrition": {
            "calories": 472.0,
            "proteins": 5.0,
            "carbohydrates": 68.0,
            "fats": 20.0,
            "fiber_grams": 2.0,
            "sodium_mg": 400.0,
            "sugar_grams": 38.0,
            "potassium_mg": 150.0
        }
    }

# ==========================================
# TESTS FOR: get_product_by_barcode
# ==========================================

def test_get_product_by_barcode_when_document_exists_returns_mapped_item(mongo_adapter, mock_collection, valid_bson_document):
    # Arrange
    barcode = "7622300336738"
    mock_collection.find_one.return_value = valid_bson_document
    
    # Act
    result = mongo_adapter.get_product_by_barcode(barcode)
    
    # Assert
    assert result is not None
    assert isinstance(result, FoodItem)
    assert result.barcode == barcode
    assert result.nutrition.calories == 472.0
    mock_collection.find_one.assert_called_once_with({"barcode": barcode})

def test_get_product_by_barcode_when_document_missing_returns_none(mongo_adapter, mock_collection):
    # Arrange
    barcode = "0000000"
    mock_collection.find_one.return_value = None
    
    # Act
    result = mongo_adapter.get_product_by_barcode(barcode)
    
    # Assert
    assert result is None
    mock_collection.find_one.assert_called_once_with({"barcode": barcode})

def test_get_product_by_barcode_on_connection_failure_returns_none(mongo_adapter, mock_collection):
    # Arrange
    barcode = "123"
    mock_collection.find_one.side_effect = ConnectionFailure("Network down")
    
    # Act
    result = mongo_adapter.get_product_by_barcode(barcode)
    
    # Assert
    assert result is None

def test_get_product_by_barcode_on_general_pymongo_error_returns_none(mongo_adapter, mock_collection):
    # Arrange
    barcode = "123"
    mock_collection.find_one.side_effect = PyMongoError("Unexpected DB error")
    
    # Act
    result = mongo_adapter.get_product_by_barcode(barcode)
    
    # Assert
    assert result is None


# ==========================================
# TESTS FOR: search_products_by_name
# ==========================================

def test_search_products_with_results_returns_mapped_list(mongo_adapter, mock_collection, valid_bson_document):
    # Arrange
    query = "Oreo"
    # Mocking the cursor behavior of PyMongo (which is an iterable)
    mock_cursor = MagicMock()
    mock_cursor.__iter__.return_value = [valid_bson_document, valid_bson_document]
    
    # Mocking the chain: collection.find().limit()
    mock_find_result = MagicMock()
    mock_find_result.limit.return_value = mock_cursor
    mock_collection.find.return_value = mock_find_result
    
    # Act
    results = mongo_adapter.search_products_by_name(query)
    
    # Assert
    assert len(results) == 2
    assert isinstance(results[0], FoodItem)
    mock_collection.find.assert_called_once_with({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"brand": {"$regex": query, "$options": "i"}}
        ]
    })
    mock_find_result.limit.assert_called_once_with(10)

def test_search_products_on_operation_failure_returns_empty_list(mongo_adapter, mock_collection):
    # Arrange
    query = "Oreo"
    # Typically happens if the text index is missing in MongoDB
    mock_collection.find.side_effect = OperationFailure("text index required for $text query")
    
    # Act
    results = mongo_adapter.search_products_by_name(query)
    
    # Assert
    assert results == []

def test_search_products_on_general_pymongo_error_returns_empty_list(mongo_adapter, mock_collection):
    # Arrange
    query = "Oreo"
    mock_collection.find.side_effect = PyMongoError("Cursor timeout")
    
    # Act
    results = mongo_adapter.search_products_by_name(query)
    
    # Assert
    assert results == []


# ==========================================
# TESTS FOR: save_product
# ==========================================

def test_save_product_executes_upsert_successfully(mongo_adapter, mock_collection, valid_food_item):
    # Arrange (Using the fixture from conftest.py)
    
    # Act
    mongo_adapter.save_product(valid_food_item)
    
    # Assert
    mock_collection.update_one.assert_called_once()
    args, kwargs = mock_collection.update_one.call_args
    assert args[0] == {"barcode": valid_food_item.barcode}
    assert "$set" in args[1]
    assert kwargs.get("upsert") is True

def test_save_product_fails_silently_on_pymongo_error(mongo_adapter, mock_collection, valid_food_item):
    # Arrange
    mock_collection.update_one.side_effect = PyMongoError("Write conflict")
    
    # Act & Assert
    # The method should catch the error and not raise it, acting as a graceful degradation
    try:
        mongo_adapter.save_product(valid_food_item)
    except Exception as e:
        pytest.fail(f"save_product should fail silently, but raised: {e}")