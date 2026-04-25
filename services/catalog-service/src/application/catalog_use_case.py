import logging
from typing import List
from src.domain.entities import FoodItem
from src.domain.ports import FoodCatalogPort
from src.domain.exceptions import FoodNotFoundError, InvalidDomainDataError

logger = logging.getLogger(__name__)

class CatalogUseCase:
    """
    Application service that orchestrates catalog business workflows.
    Acts as the strict boundary between the delivery mechanism (gRPC) 
    and the outbound adapters (OpenFoodFacts/Redis).
    """
    
    def __init__(self, catalog_port: FoodCatalogPort):
        # We depend on the abstraction (Port), not the concrete implementation.
        self._catalog_port = catalog_port

    def find_food(self, barcode: str) -> FoodItem:
        """
        Retrieves a food item by barcode, enforcing existence.
        
        Raises:
            InvalidDomainDataError: If the input is empty or malformed.
            FoodNotFoundError: If the port returns None.
        """
        clean_barcode = self._sanitize_input(barcode, "Barcode")
        
        logger.info(f"Initiating lookup for barcode: {clean_barcode}")
        
        product = self._catalog_port.get_product_by_barcode(clean_barcode)
        
        if not product:
            # We transform the absence of data (None) into a formal domain exception
            # so the outer layers (gRPC) can map it to a NOT_FOUND status code.
            logger.warning(f"Barcode '{clean_barcode}' yielded no results from the catalog port.")
            raise FoodNotFoundError(identifier=clean_barcode)
            
        return product
    
    def search_food(self, query: str) -> List[FoodItem]:
        """
        Searches the catalog via free text.
        
        Raises:
            InvalidDomainDataError: If the search query is empty.
        """
        clean_query = self._sanitize_input(query, "Search query")
        
        logger.info(f"Initiating text search for: '{clean_query}'")
        
        results = self._catalog_port.search_products_by_name(clean_query)
        
        if not results:
            logger.info(f"Search for '{clean_query}' completed with 0 results.")
            
        return results

    def _sanitize_input(self, value: str, field_name: str) -> str:
        """
        Defensive barrier to prevent empty or whitespace-only strings 
        from triggering unnecessary external network calls.
        """
        if not value:
            raise InvalidDomainDataError(f"{field_name} cannot be null or empty.")
            
        clean_value = value.strip()
        if not clean_value:
            raise InvalidDomainDataError(f"{field_name} cannot consist only of whitespace.")
            
        return clean_value