import pytest
import requests
from unittest.mock import patch, MagicMock

from src.infrastructure.fatsecret.fatsecret_adapter import FatSecretAdapter
from src.infrastructure.fatsecret.fatsecret_authenticator import FatSecretAuthenticator
from src.infrastructure.fatsecret.fatsecret_mapper import FatSecretMapper
from src.domain.entities import FoodItem
from src.domain.exceptions import (
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ExternalServiceUnavailableError,
    InvalidDomainDataError
)

# --- Fixtures ---

@pytest.fixture(autouse=True)
def fast_sleep():
    """
    Crucial for performance: bypasses the actual time.sleep inside our exponential
    backoff decorator so that retry tests execute instantly.
    """
    with patch("src.infrastructure.decorators.time.sleep") as mock_sleep:
        yield mock_sleep

@pytest.fixture
def mock_authenticator():
    auth = MagicMock(spec=FatSecretAuthenticator)
    auth.get_auth_headers.return_value = {"Authorization": "Bearer dummy_token"}
    return auth

@pytest.fixture
def mock_mapper():
    return MagicMock(spec=FatSecretMapper)

@pytest.fixture
def adapter(mock_authenticator, mock_mapper):
    return FatSecretAdapter(
        api_url="https://fake.fatsecret.com/rest",
        authenticator=mock_authenticator,
        mapper=mock_mapper
    )

@pytest.fixture
def mock_response():
    """Helper to generate generic requests.Response mocks."""
    def _generator(status_code=200, json_data=None):
        resp = MagicMock()
        resp.status_code = status_code
        if json_data is not None:
            resp.json.return_value = json_data
        
        # raise_for_status simulation
        if status_code >= 400:
            resp.raise_for_status.side_effect = requests.exceptions.HTTPError(f"HTTP {status_code}")
        else:
            resp.raise_for_status.return_value = None
            
        return resp
    return _generator

# ==========================================
# TESTS FOR: _execute_request (HTTP Status Handling)
# ==========================================

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_execute_request_success_returns_response(mock_get, adapter, mock_response):
    # Arrange
    mock_get.return_value = mock_response(200, {"success": True})
    
    # Act
    resp = adapter._execute_request({"method": "test"})
    
    # Assert
    assert resp.status_code == 200
    mock_get.assert_called_once()
    adapter._authenticator.get_auth_headers.assert_called_once()

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_execute_request_401_refreshes_token_and_raises_error(mock_get, adapter, mock_response):
    # Arrange
    mock_get.return_value = mock_response(401)
    
    # Act & Assert
    with pytest.raises(ProviderAuthenticationError):
        adapter._execute_request({"method": "test"})
        
    adapter._authenticator.refresh_token.assert_called_once()

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_execute_request_400_raises_invalid_domain_data(mock_get, adapter, mock_response):
    # Arrange
    mock_get.return_value = mock_response(400)
    
    # Act & Assert
    with pytest.raises(InvalidDomainDataError):
        adapter._execute_request({"method": "test"})

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_execute_request_429_raises_rate_limit_error(mock_get, adapter, mock_response):
    # Arrange
    mock_get.return_value = mock_response(429)
    
    # Act & Assert
    with pytest.raises(ProviderRateLimitError):
        adapter._execute_request({"method": "test"})

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_execute_request_500_raises_service_unavailable(mock_get, adapter, mock_response):
    # Arrange
    mock_get.return_value = mock_response(503)
    
    # Act & Assert
    with pytest.raises(ExternalServiceUnavailableError):
        adapter._execute_request({"method": "test"})


# ==========================================
# TESTS FOR: get_product_by_barcode
# ==========================================

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_get_product_by_barcode_success_makes_two_calls(mock_get, adapter, mock_response, valid_food_item):
    # Arrange
    barcode = "12345"
    food_id = "999"
    
    # First call returns the ID, second call returns the details
    resp1 = mock_response(200, {"food_id": {"value": food_id}})
    resp2 = mock_response(200, {"food": {"name": "Test"}})
    mock_get.side_effect = [resp1, resp2]
    
    adapter._mapper.map_to_domain.return_value = valid_food_item
    
    # Act
    result = adapter.get_product_by_barcode(barcode)
    
    # Assert
    assert result == valid_food_item
    assert mock_get.call_count == 2
    adapter._mapper.map_to_domain.assert_called_once_with({"name": "Test"}, barcode)

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_get_product_by_barcode_not_found_returns_none(mock_get, adapter, mock_response):
    # Arrange
    # Missing 'food_id' key entirely
    mock_get.return_value = mock_response(200, {"error": {"code": "3", "message": "Invalid barcode"}})
    
    # Act
    result = adapter.get_product_by_barcode("0000")
    
    # Assert
    assert result is None
    assert mock_get.call_count == 1 # Second call is never made

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_get_product_by_barcode_json_decode_error_raises_exception(mock_get, adapter):
    # Arrange
    resp = MagicMock()
    resp.status_code = 200
    resp.raise_for_status.return_value = None
    resp.json.side_effect = requests.exceptions.JSONDecodeError("msg", "doc", 0)
    mock_get.return_value = resp
    
    # Act & Assert
    with pytest.raises(ExternalServiceUnavailableError) as exc_info:
        adapter.get_product_by_barcode("123")
    
    assert adapter.MALFORMED_JSON_ERROR in exc_info.value.internal_reason


# ==========================================
# TESTS FOR: search_products_by_name
# ==========================================

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_search_products_with_list_returns_mapped_items(mock_get, adapter, mock_response, valid_food_item):
    # Arrange
    mock_json = {
        "foods": {
            "food": [
                {"food_name": "A"},
                {"food_name": "B"}
            ]
        }
    }
    mock_get.return_value = mock_response(200, mock_json)
    
    # Mapper successfully maps both
    adapter._mapper.map_to_domain.side_effect = [valid_food_item, valid_food_item]
    
    # Act
    results = adapter.search_products_by_name("query")
    
    # Assert
    assert len(results) == 2
    assert adapter._mapper.map_to_domain.call_count == 2

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_search_products_with_dict_normalizes_to_list(mock_get, adapter, mock_response, valid_food_item):
    # Arrange
    # FatSecret returns a dict instead of list if there is only 1 result
    mock_json = {
        "foods": {
            "food": {"food_name": "Solo Item"}
        }
    }
    mock_get.return_value = mock_response(200, mock_json)
    adapter._mapper.map_to_domain.return_value = valid_food_item
    
    # Act
    results = adapter.search_products_by_name("query")
    
    # Assert
    assert len(results) == 1
    adapter._mapper.map_to_domain.assert_called_once_with({"food_name": "Solo Item"})

# ==========================================
# TESTS FOR: Resiliency (Exponential Backoff)
# ==========================================

@patch("src.infrastructure.fatsecret.fatsecret_adapter.requests.get")
def test_get_product_by_barcode_retries_on_timeout(mock_get, adapter):
    # Arrange
    # Simulating a timeout on every single call
    mock_get.side_effect = requests.exceptions.Timeout("Connection timed out")
    
    # Act & Assert
    with pytest.raises(requests.exceptions.Timeout):
        adapter.get_product_by_barcode("123")
        
    # Assert it tried exactly 4 times (1 initial + 3 retries max)
    assert mock_get.call_count == 4