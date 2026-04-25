import pytest
import grpc
from unittest.mock import MagicMock, create_autospec

from src.interfaces.grpc_service import NutritionalCatalogService
from src.interfaces import catalog_pb2
from src.application.catalog_use_case import CatalogUseCase
from src.domain.exceptions import (
    FoodNotFoundError, 
    InvalidDomainDataError, 
    ExternalServiceUnavailableError
)

# FIXTURES
@pytest.fixture
def mock_use_case():
    """Mock estricto del Caso de Uso."""
    return create_autospec(CatalogUseCase)

@pytest.fixture
def mock_context():
    """Simula el contexto de gRPC (para capturar set_code y set_details)."""
    return MagicMock()

@pytest.fixture
def grpc_service(mock_use_case):
    """Instancia el servicio inyectándole el caso de uso mockeado."""
    return NutritionalCatalogService(use_case=mock_use_case)


def test_get_food_item_success_returns_food_response(grpc_service, mock_use_case, mock_context, valid_food_item):
    # Arrange
    request = MagicMock(barcode="7622300336738")
    mock_use_case.find_food.return_value = valid_food_item

    # Act
    response = grpc_service.GetFoodItem(request, mock_context)

    # Assert
    assert isinstance(response, catalog_pb2.FoodResponse)
    assert response.barcode == "7622300336738"
    assert response.name == "Oreo Original"
    assert response.calories_per_100g == pytest.approx(472.0)
    mock_context.set_code.assert_not_called()


def test_get_food_item_not_found_sets_grpc_status_not_found(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(barcode="000000")
    mock_use_case.find_food.side_effect = FoodNotFoundError("000000")

    # Act
    response = grpc_service.GetFoodItem(request, mock_context)

    # Assert
    assert isinstance(response, catalog_pb2.FoodResponse)
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.NOT_FOUND)
    assert "could not be found" in mock_context.set_details.call_args[0][0]


def test_get_food_item_invalid_data_sets_grpc_status_invalid_argument(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(barcode="   ")
    mock_use_case.find_food.side_effect = InvalidDomainDataError("Barcode cannot be empty")

    # Act
    response = grpc_service.GetFoodItem(request, mock_context)

    # Assert
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.INVALID_ARGUMENT)
    assert "Barcode cannot be empty" in mock_context.set_details.call_args[0][0]
    assert isinstance(response, catalog_pb2.FoodResponse)
    assert response.barcode == ""


def test_get_food_item_upstream_failure_sets_grpc_status_unavailable(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(barcode="12345")
    mock_use_case.find_food.side_effect = ExternalServiceUnavailableError("HTTP 503")

    # Act
    response = grpc_service.GetFoodItem(request, mock_context)

    # Assert
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.UNAVAILABLE)
    assert isinstance(response, catalog_pb2.FoodResponse)
    assert response.barcode == ""



def test_search_food_success_returns_search_response_with_items(grpc_service, mock_use_case, mock_context, valid_food_item):
    # Arrange
    request = MagicMock(query="Oreo")
    mock_use_case.search_food.return_value = [valid_food_item]

    # Act
    response = grpc_service.SearchFood(request, mock_context)

    # Assert
    assert isinstance(response, catalog_pb2.SearchResponse)
    assert len(response.items) == 1
    assert response.items[0].name == "Oreo Original"
    mock_context.set_code.assert_not_called()


def test_search_food_invalid_query_sets_grpc_status_invalid_argument(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(query="")
    mock_use_case.search_food.side_effect = InvalidDomainDataError("Query empty")

    # Act
    response = grpc_service.SearchFood(request, mock_context)

    # Assert
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.INVALID_ARGUMENT)
    assert isinstance(response, catalog_pb2.SearchResponse)
    assert len(response.items) == 0

def test_get_food_item_internal_critical_error_sets_grpc_status_internal(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(barcode="12345")
    mock_use_case.find_food.side_effect = Exception("Catástrofe interna inesperada")

    # Act
    response = grpc_service.GetFoodItem(request, mock_context)

    # Assert
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.INTERNAL)
    assert "Internal server error." in mock_context.set_details.call_args[0][0]
    assert isinstance(response, catalog_pb2.FoodResponse)


def test_search_food_internal_critical_error_sets_grpc_status_internal(grpc_service, mock_use_case, mock_context):
    # Arrange
    request = MagicMock(query="Oreo")
    mock_use_case.search_food.side_effect = Exception("Base de datos en llamas")

    # Act
    response = grpc_service.SearchFood(request, mock_context)

    # Assert
    mock_context.set_code.assert_called_once_with(grpc.StatusCode.INTERNAL)
    assert "Internal server error." in mock_context.set_details.call_args[0][0]
    assert isinstance(response, catalog_pb2.SearchResponse)