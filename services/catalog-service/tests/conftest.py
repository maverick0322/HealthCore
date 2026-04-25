import pytest
from unittest.mock import create_autospec

from src.domain.entities import FoodItem, NutritionalValues
from src.domain.ports import FoodCatalogPort
from src.application.catalog_use_case import CatalogUseCase

# DOMAIN FIXTURES (Reusable test data for domain entities)

@pytest.fixture
def valid_nutritional_values() -> NutritionalValues:
    """Provee un objeto de valores nutricionales válido para pruebas."""
    return NutritionalValues(
        calories=472.0,
        proteins=5.5,
        carbohydrates=67.0,
        fats=19.0
    )

@pytest.fixture
def valid_food_item(valid_nutritional_values) -> FoodItem:
    """Provee una entidad FoodItem completa y válida."""
    return FoodItem(
        barcode="7622300336738",
        name="Oreo Original",
        brand="Nabisco",
        image_url="http://example.com/oreo.jpg",
        nutrition=valid_nutritional_values
    )

# INFRASTRUCTURE & APPLICATION FIXTURES (Mocks)
@pytest.fixture
def mock_catalog_port() -> FoodCatalogPort:
    """
    Crea un Mock estricto del puerto. 
    Usar create_autospec garantiza que si alguien cambia la firma de los métodos 
    en FoodCatalogPort en el futuro, los tests fallarán (evitando falsos positivos).
    """
    return create_autospec(FoodCatalogPort)

@pytest.fixture
def catalog_use_case(mock_catalog_port) -> CatalogUseCase:
    """
    Inyecta automáticamente el Mock del puerto en el Caso de Uso.
    Cualquier test que use este fixture estará probando el UseCase en total aislamiento.
    """
    return CatalogUseCase(catalog_port=mock_catalog_port)