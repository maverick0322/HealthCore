from abc import ABC, abstractmethod
from typing import List
from src.domain.entities import FoodItem

class FoodCatalogPort(ABC):
    """Contrato (Puerto de Salida) que cualquier catálogo externo debe cumplir."""
    
    @abstractmethod
    def get_product_by_barcode(self, barcode: str) -> FoodItem:
        pass

    @abstractmethod
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        pass