import pytest
from unittest.mock import MagicMock
from src.domain.exceptions import FoodNotFoundError, InvalidDomainDataError
from src.application.catalog_use_case import CatalogUseCase

# --- Fixtures Locales para los Puertos ---
@pytest.fixture
def mock_local_port():
    return MagicMock()

@pytest.fixture
def mock_external_port():
    return MagicMock()

@pytest.fixture
def catalog_use_case(mock_local_port, mock_external_port):
    return CatalogUseCase(local_port=mock_local_port, external_port=mock_external_port)

# ==========================================
# TESTS FOR: find_food
# ==========================================

def test_find_food_cache_hit_returns_local_data(catalog_use_case, mock_local_port, mock_external_port, valid_food_item):
    # Arrange
    barcode = "7622300336738"
    mock_local_port.get_product_by_barcode.return_value = valid_food_item
    
    # Act
    result = catalog_use_case.find_food(barcode)
    
    # Assert
    assert result == valid_food_item
    mock_local_port.get_product_by_barcode.assert_called_once_with(barcode)
    mock_external_port.get_product_by_barcode.assert_not_called()
    mock_local_port.save_product.assert_not_called()

def test_find_food_cache_miss_fetches_externally_and_saves_locally(catalog_use_case, mock_local_port, mock_external_port, valid_food_item):
    # Arrange
    barcode = "7622300336738"
    mock_local_port.get_product_by_barcode.return_value = None
    mock_external_port.get_product_by_barcode.return_value = valid_food_item
    
    # Act
    result = catalog_use_case.find_food(barcode)
    
    # Assert
    assert result == valid_food_item
    mock_local_port.get_product_by_barcode.assert_called_once_with(barcode)
    mock_external_port.get_product_by_barcode.assert_called_once_with(barcode)
    mock_local_port.save_product.assert_called_once_with(valid_food_item)

def test_find_food_absolute_miss_raises_food_not_found_error(catalog_use_case, mock_local_port, mock_external_port):
    # Arrange
    barcode = "99999999"
    mock_local_port.get_product_by_barcode.return_value = None
    mock_external_port.get_product_by_barcode.return_value = None
    
    # Act & Assert
    with pytest.raises(FoodNotFoundError) as exc_info:
        catalog_use_case.find_food(barcode)
        
    assert barcode in str(exc_info.value)
    mock_local_port.get_product_by_barcode.assert_called_once_with(barcode)
    mock_external_port.get_product_by_barcode.assert_called_once_with(barcode)
    mock_local_port.save_product.assert_not_called()

def test_find_food_with_empty_barcode_raises_invalid_domain_data_error(catalog_use_case, mock_local_port, mock_external_port):
    # Arrange
    empty_barcode = ""
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError) as exc_info:
        catalog_use_case.find_food(empty_barcode)
        
    assert "Barcode cannot be null or empty" in str(exc_info.value)
    mock_local_port.get_product_by_barcode.assert_not_called()
    mock_external_port.get_product_by_barcode.assert_not_called()

# ==========================================
# TESTS FOR: search_food
# ==========================================

def test_search_food_cache_hit_returns_local_list(catalog_use_case, mock_local_port, mock_external_port, valid_food_item):
    # Arrange
    query = "Oreo"
    expected_results = [valid_food_item, valid_food_item]
    mock_local_port.search_products_by_name.return_value = expected_results
    
    # Act
    results = catalog_use_case.search_food(query)
    
    # Assert
    assert len(results) == 2
    assert results == expected_results
    mock_local_port.search_products_by_name.assert_called_once_with(query)
    mock_external_port.search_products_by_name.assert_not_called()
    mock_local_port.save_product.assert_not_called()

def test_search_food_cache_miss_fetches_externally_and_saves_all_locally(catalog_use_case, mock_local_port, mock_external_port, valid_food_item):
    # Arrange
    query = "Oreo"
    expected_results = [valid_food_item, valid_food_item]
    mock_local_port.search_products_by_name.return_value = []
    mock_external_port.search_products_by_name.return_value = expected_results
    
    # Act
    results = catalog_use_case.search_food(query)
    
    # Assert
    assert len(results) == 2
    mock_local_port.search_products_by_name.assert_called_once_with(query)
    mock_external_port.search_products_by_name.assert_called_once_with(query)
    assert mock_local_port.save_product.call_count == 2

def test_search_food_absolute_miss_returns_empty_list(catalog_use_case, mock_local_port, mock_external_port):
    # Arrange
    query = "ProductoInexistente123"
    mock_local_port.search_products_by_name.return_value = []
    mock_external_port.search_products_by_name.return_value = []
    
    # Act
    results = catalog_use_case.search_food(query)
    
    # Assert
    assert results == []
    mock_local_port.search_products_by_name.assert_called_once_with(query)
    mock_external_port.search_products_by_name.assert_called_once_with(query)
    mock_local_port.save_product.assert_not_called()

def test_search_food_with_whitespace_query_raises_invalid_domain_data_error(catalog_use_case, mock_local_port, mock_external_port):
    # Arrange
    whitespace_query = "   "
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError):
        catalog_use_case.search_food(whitespace_query)
        
    mock_local_port.search_products_by_name.assert_not_called()
    mock_external_port.search_products_by_name.assert_not_called()