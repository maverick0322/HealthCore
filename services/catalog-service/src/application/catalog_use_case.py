import logging
from typing import List
from src.domain.entities import FoodItem
from src.domain.ports import LocalCatalogPort, ExternalCatalogPort
from src.domain.exceptions import FoodNotFoundError, InvalidDomainDataError

logger = logging.getLogger(__name__)

class CatalogUseCase:
    """
    Application service that orchestrates catalog business workflows.
    Implements the Cache-Aside pattern to reduce latency and API quota usage.
    """
    
    def __init__(self, local_port: LocalCatalogPort, external_port: ExternalCatalogPort):
        self._local_port = local_port
        self._external_port = external_port

    def find_food(self, barcode: str) -> FoodItem:
        """
        Retrieves a food item by barcode, preferring local cache over external calls.
        
        Raises:
            InvalidDomainDataError: If the input is empty or malformed.
            FoodNotFoundError: If neither the cache nor the external provider has the item.
        """
        clean_barcode = self._sanitize_input(barcode, "Barcode")
        logger.info(f"Initiating lookup for barcode: '{clean_barcode}'")
        
        product = self._local_port.get_product_by_barcode(clean_barcode)
        if product:
            logger.info("Cache hit. Returning product from local database.")
            return product
            
        logger.info("Cache miss. Fetching from external provider.")
        product = self._external_port.get_product_by_barcode(clean_barcode)
        
        if not product:
            logger.warning(f"Barcode '{clean_barcode}' yielded no results externally.")
            raise FoodNotFoundError(identifier=clean_barcode)
            
        self._local_port.save_product(product)
        
        return product
    
    def search_food(self, query: str) -> List[FoodItem]:
        """
        Searches the catalog via free text. 
        Returns local results if available, otherwise queries externally and caches them.
        """
        clean_query = self._sanitize_input(query, "Search query")
        logger.info(f"Initiating text search for: '{clean_query}'")
        
        results = self._local_port.search_products_by_name(clean_query)
        if results:
            logger.info(f"Cache hit. Returning {len(results)} results from local database.")
            return results
            
        logger.info("Cache miss. Searching external provider.")
        results = self._external_port.search_products_by_name(clean_query)
        
        if results:
            logger.info(f"Caching {len(results)} new search results locally.")
            for item in results:
                self._local_port.save_product(item)
        else:
            logger.info(f"Search for '{clean_query}' completed with 0 results externally.")
            
        return results

    def _sanitize_input(self, value: str, field_name: str) -> str:
        """
        Defensive barrier to prevent empty or whitespace-only strings 
        from triggering unnecessary network calls or database queries.
        """
        if not value:
            raise InvalidDomainDataError(f"{field_name} cannot be null or empty.")
            
        clean_value = value.strip()
        if not clean_value:
            raise InvalidDomainDataError(f"{field_name} cannot consist only of whitespace.")
            
        return clean_value