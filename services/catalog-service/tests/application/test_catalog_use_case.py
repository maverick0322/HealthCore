import pytest
from src.domain.exceptions import FoodNotFoundError, InvalidDomainDataError


def test_find_food_with_valid_barcode_returns_food_item(catalog_use_case, mock_catalog_port, valid_food_item):
    # Arrange
    barcode = "7622300336738"
    mock_catalog_port.get_product_by_barcode.return_value = valid_food_item
    
    # Act
    result = catalog_use_case.find_food(barcode)
    
    # Assert
    assert result == valid_food_item
    mock_catalog_port.get_product_by_barcode.assert_called_once_with(barcode)

def test_find_food_with_empty_barcode_raises_invalid_domain_data_error(catalog_use_case, mock_catalog_port):
    # Arrange
    empty_barcode = ""
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError) as exc_info:
        catalog_use_case.find_food(empty_barcode)
        
    assert "Barcode cannot be null or empty" in str(exc_info.value)
    mock_catalog_port.get_product_by_barcode.assert_not_called()

def test_find_food_with_whitespace_barcode_raises_invalid_domain_data_error(catalog_use_case, mock_catalog_port):
    # Arrange
    whitespace_barcode = "   "
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError) as exc_info:
        catalog_use_case.find_food(whitespace_barcode)
        
    assert "Barcode cannot consist only of whitespace" in str(exc_info.value)
    mock_catalog_port.get_product_by_barcode.assert_not_called()

def test_find_food_when_port_returns_none_raises_food_not_found_error(catalog_use_case, mock_catalog_port):
    # Arrange
    barcode = "99999999"
    mock_catalog_port.get_product_by_barcode.return_value = None
    
    # Act & Assert
    with pytest.raises(FoodNotFoundError) as exc_info:
        catalog_use_case.find_food(barcode)
        
    assert barcode in str(exc_info.value)
    mock_catalog_port.get_product_by_barcode.assert_called_once_with(barcode)


def test_search_food_with_valid_query_returns_list_of_items(catalog_use_case, mock_catalog_port, valid_food_item):
    # Arrange
    query = "Oreo"
    expected_results = [valid_food_item, valid_food_item]
    mock_catalog_port.search_products_by_name.return_value = expected_results
    
    # Act
    results = catalog_use_case.search_food(query)
    
    # Assert
    assert len(results) == 2
    assert results == expected_results
    mock_catalog_port.search_products_by_name.assert_called_once_with(query)

def test_search_food_with_whitespace_query_raises_invalid_domain_data_error(catalog_use_case, mock_catalog_port):
    # Arrange
    whitespace_query = "   "
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError):
        catalog_use_case.search_food(whitespace_query)
        
    mock_catalog_port.search_products_by_name.assert_not_called()

def test_search_food_with_no_matches_returns_empty_list(catalog_use_case, mock_catalog_port):
    # Arrange
    query = "ProductoInexistente123"
    mock_catalog_port.search_products_by_name.return_value = []
    
    # Act
    results = catalog_use_case.search_food(query)
    
    # Assert
    assert results == []
    assert isinstance(results, list)
    mock_catalog_port.search_products_by_name.assert_called_once_with(query)