from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities import FoodItem

class ExternalCatalogPort(ABC):
    """
    Outbound port for 3rd-party catalog providers (e.g., FatSecret).
    Strictly acts as a read-only source of truth.
    """
    @abstractmethod
    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        pass

    @abstractmethod
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        pass

class LocalCatalogPort(ABC):
    """
    Outbound port for local caching and persistence (e.g., MongoDB).
    Allows the system to save external responses to avoid rate limits and reduce latency.
    """
    @abstractmethod
    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        pass

    @abstractmethod
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        pass

    @abstractmethod
    def save_product(self, food_item: FoodItem) -> None:
        """
        Persists a retrieved external food item into the local database.
        """
        pass