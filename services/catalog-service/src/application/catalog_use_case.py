import logging
import uuid
from typing import List, Dict, Any
from src.domain.entities import FoodItem
from src.domain.ports import LocalCatalogPort, ExternalCatalogPort
from src.domain.exceptions import FoodNotFoundError, InvalidDomainDataError

logger = logging.getLogger(__name__)

class CatalogUseCase:
    """
    Application service that orchestrates catalog business workflows.
    Implements the Cache-Aside pattern and Local Catalog Management (CU-13).
    """
    
    def __init__(self, local_port: LocalCatalogPort, external_port: ExternalCatalogPort):
        self._local_port = local_port
        self._external_port = external_port


    def find_food(self, barcode: str) -> FoodItem:
        """
        Retrieves a food item by barcode, preferring local cache over external calls.
        Filters out inactive (soft-deleted) local foods.
        """
        clean_barcode = self._sanitize_input(barcode, "Barcode")
        logger.info(f"Initiating lookup for barcode: '{clean_barcode}'")
        
        product = self._local_port.get_product_by_barcode(clean_barcode)
        
        if product:
            if not product.is_active:
                logger.warning(f"Barcode '{clean_barcode}' is locally deactivated.")
                raise FoodNotFoundError(identifier=clean_barcode)
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
        Filters out inactive (soft-deleted) local foods.
        """
        clean_query = self._sanitize_input(query, "Search query")
        logger.info(f"Initiating text search for: '{clean_query}'")
        
        results = self._local_port.search_products_by_name(clean_query)
        
        active_results = [item for item in results if item.is_active]
        
        if active_results:
            logger.info(f"Cache hit. Returning {len(active_results)} active results from local database.")
            return active_results
            
        logger.info("Cache miss. Searching external provider.")
        results = self._external_port.search_products_by_name(clean_query)
        
        if results:
            logger.info(f"Caching {len(results)} new search results locally.")
            for item in results:
                self._local_port.save_product(item)
        else:
            logger.info(f"Search for '{clean_query}' completed with 0 results externally.")
            
        return results


    def create_local_food(self, food_data: Dict[str, Any], user_id: str, role: str) -> FoodItem:
        """
        CU-13: Permite a un Admin o Nutriólogo registrar un alimento local.
        """
        if role not in ["ROLE_ADMIN", "ROLE_NUTRITIONIST"]:
            raise PermissionError("Access Denied: Only administrators and nutritionists can create local foods.")

        barcode = food_data.get("barcode")
        name = food_data.get("name", "local")

        if not barcode or not str(barcode).strip():
            name_slug = str(name).lower().replace(" ", "-")
            food_data["barcode"] = f"local-{name_slug}-{str(uuid.uuid4())[:8]}"
        else:
            existing = self._local_port.get_product_by_barcode(str(barcode).strip())
            if existing:
                raise InvalidDomainDataError(f"A food item with barcode '{barcode}' already exists.")

        food_data["is_local"] = True
        food_data["is_active"] = True
        food_data["created_by"] = user_id

        try:
            food_item = FoodItem(**food_data)
            food_item.validate_macronutrients()
        except Exception as e:
            raise InvalidDomainDataError(f"Invalid nutritional data: {str(e)}")

        self._local_port.save_product(food_item)
        logger.info(f"User {user_id} ({role}) successfully created local food: {food_item.barcode}")
        
        return food_item

    def update_local_food(self, barcode: str, food_data: Dict[str, Any], user_id: str, role: str) -> FoodItem:
        """
        CU-13: Permite a un Admin actualizar los datos de un alimento local.
        """
        if role != "ROLE_ADMIN":
            raise PermissionError("Access Denied: Only administrators can update catalog items.")

        clean_barcode = self._sanitize_input(barcode, "Barcode")
        existing = self._local_port.get_product_by_barcode(clean_barcode)
        
        if not existing:
            raise FoodNotFoundError(identifier=clean_barcode)

        if not existing.is_local:
            raise InvalidDomainDataError("External foods (FatSecret) cannot be modified locally.")

        updated_data = existing.model_dump()
        for field in ["name", "brand", "image_url", "nutrition"]:
            if field in food_data:
                updated_data[field] = food_data[field]

        try:
            updated_item = FoodItem(**updated_data)
            updated_item.validate_macronutrients()
        except Exception as e:
            raise InvalidDomainDataError(f"Invalid nutritional data during update: {str(e)}")

        self._local_port.save_product(updated_item)
        logger.info(f"Admin {user_id} successfully updated food: {clean_barcode}")
        
        return updated_item

    def deactivate_food(self, barcode: str, user_id: str, role: str) -> None:
        """
        CU-13: Soft delete para Administradores. Oculta el alimento de futuras búsquedas.
        """
        if role != "ROLE_ADMIN":
            raise PermissionError("Access Denied: Only administrators can deactivate catalog items.")

        clean_barcode = self._sanitize_input(barcode, "Barcode")
        existing = self._local_port.get_product_by_barcode(clean_barcode)
        
        if not existing:
            raise FoodNotFoundError(identifier=clean_barcode)

        if not existing.is_local:
            raise InvalidDomainDataError("External foods (FatSecret) cannot be deactivated.")

        existing.is_active = False
        self._local_port.save_product(existing)
        
        logger.info(f"Admin {user_id} successfully deactivated food: {clean_barcode}")

    # ==========================================
    # UTILITY METHODS
    # ==========================================

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