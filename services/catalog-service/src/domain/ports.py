from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities import FoodItem

class FoodCatalogPort(ABC):
    """
    Outbound port defining the contract for catalog data retrieval.
    Adapters (e.g., HTTP Clients, Cache Proxies) must implement this interface.
    """
    
    @abstractmethod
    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        """
        Retrieves a single food item by its unique barcode.
        Returns None if the item does not exist.
        """
        pass

    @abstractmethod
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        """
        Retrieves a list of food items matching the search query.
        Returns an empty list if no matches are found.
        """
        pass