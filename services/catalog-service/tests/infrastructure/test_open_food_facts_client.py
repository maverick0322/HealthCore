import pytest
import responses
from requests.exceptions import Timeout
from src.infrastructure.open_food_facts_client import OpenFoodFactsAdapter
from src.domain.exceptions import ExternalServiceUnavailableError, InvalidDomainDataError

#Adapter fixture
@pytest.fixture
def adapter():
    return OpenFoodFactsAdapter()

@responses.activate
def test_get_product_success_returns_food_item(adapter):
    # Arrange
    barcode = "7622300336738"
    url = f"{adapter.BASE_URL}{barcode}.json"
    
    mock_json_response = {
        "status": 1,
        "product": {
            "code": "7622300336738",
            "product_name": "Oreo Original",
            "brands": "Nabisco",
            "image_url": "http://example.com/oreo.jpg",
            "nutriments": {
                "energy-kcal_100g": 472.0,
                "proteins_100g": 5.5,
                "carbohydrates_100g": 67.0,
                "fat_100g": 19.0
            }
        }
    }
    
    responses.add(responses.GET, url, json=mock_json_response, status=200)

    # Act
    result = adapter.get_product_by_barcode(barcode)

    # Assert
    assert result is not None
    assert result.name == "Oreo Original"
    assert result.nutrition.calories == pytest.approx(472.0)


@responses.activate
def test_get_product_when_not_found_returns_none(adapter):
    # Arrange
    barcode = "0000000"
    url = f"{adapter.BASE_URL}{barcode}.json"
    
    responses.add(responses.GET, url, json={"status": 0}, status=200)

    # Act
    result = adapter.get_product_by_barcode(barcode)

    # Assert
    assert result is None


@responses.activate
def test_get_product_with_http_503_raises_unavailable_error(adapter):
    # Arrange
    barcode = "12345"
    url = f"{adapter.BASE_URL}{barcode}.json"
    
    responses.add(responses.GET, url, status=503)

    # Act & Assert
    with pytest.raises(ExternalServiceUnavailableError) as exc_info:
        adapter.get_product_by_barcode(barcode)
        
    assert "HTTP 503" in str(exc_info.value)


@responses.activate
def test_get_product_with_malformed_json_raises_unavailable_error(adapter):
    # Arrange
    barcode = "12345"
    url = f"{adapter.BASE_URL}{barcode}.json"
    
    responses.add(responses.GET, url, body="<html>Bad Gateway</html>", status=200)

    # Act & Assert
    with pytest.raises(ExternalServiceUnavailableError) as exc_info:
        adapter.get_product_by_barcode(barcode)
        
    assert "Error procesando la respuesta" in str(exc_info.value)


@responses.activate
def test_search_products_triggers_fallback_on_http_503(adapter):
    # Arrange
    query = "oreo"
    
    responses.add(responses.GET, adapter.SEARCH_URL, status=503)

    # Act
    results = adapter.search_products_by_name(query)

    # Assert
    assert len(results) == 1
    assert "Servidor OFF" in results[0].name

@responses.activate
def test_search_products_success_returns_list_of_food_items(adapter):
    # Arrange
    query = "oreo"
    mock_json_response = {
        "products": [
            {
                "code": "7622300336738",
                "product_name": "Oreo Original",
                "brands": "Nabisco",
                "nutriments": {"energy-kcal_100g": 472.0}
            }
        ]
    }
    responses.add(responses.GET, adapter.SEARCH_URL, json=mock_json_response, status=200)

    # Act
    results = adapter.search_products_by_name(query)

    # Assert
    assert len(results) == 1
    assert results[0].name == "Oreo Original"
    assert results[0].barcode == "7622300336738"


@responses.activate
def test_search_products_empty_results_returns_empty_list(adapter):
    # Arrange
    query = "ProductoFantasma"
    responses.add(responses.GET, adapter.SEARCH_URL, json={"products": []}, status=200)

    # Act
    results = adapter.search_products_by_name(query)

    # Assert
    assert results == []


@responses.activate
def test_search_products_with_timeout_raises_unavailable_error(adapter):
    # Arrange
    query = "oreo"
    responses.add(responses.GET, adapter.SEARCH_URL, body=Timeout("Conexión perdida"))

    # Act & Assert
    with pytest.raises(ExternalServiceUnavailableError) as exc_info:
        adapter.search_products_by_name(query)
        
    assert "tardó demasiado" in str(exc_info.value)