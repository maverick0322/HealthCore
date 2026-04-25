import logging
from typing import List
from src.domain.entities import FoodItem
from src.domain.ports import FoodCatalogPort

logger = logging.getLogger(__name__)

class CatalogUseCase:
    """Caso de uso principal para interactuar con el catálogo."""
    
    def __init__(self, catalog_port: FoodCatalogPort):
        self._catalog_port = catalog_port

    def find_food(self, barcode: str) -> FoodItem:
        """Busca un producto y retorna la entidad de dominio."""
        logger.info(f"Buscando información nutricional para el código: {barcode}")
        return self._catalog_port.get_product_by_barcode(barcode)
    
    def search_food(self, query: str) -> List[FoodItem]:
        """Busca una lista de productos por texto libre."""
        logger.info(f"Buscando lista de alimentos por texto: '{query}'")
        return self._catalog_port.search_products_by_name(query)