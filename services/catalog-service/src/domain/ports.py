from abc import ABC, abstractmethod
from src.domain.entities import FoodItem

class FoodCatalogPort(ABC):
    """Contrato (Puerto de Salida) que cualquier catálogo externo debe cumplir."""
    
    @abstractmethod
    def get_product_by_barcode(self, barcode: str) -> FoodItem:
        pass