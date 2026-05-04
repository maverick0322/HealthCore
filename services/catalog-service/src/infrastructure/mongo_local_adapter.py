import logging
from typing import List, Optional, Dict, Any
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, ConnectionFailure, OperationFailure
from src.domain.entities import FoodItem
from src.domain.ports import LocalCatalogPort

logger = logging.getLogger(__name__)

class MongoLocalCatalogAdapter(LocalCatalogPort):
    """
    Driven Adapter for local MongoDB persistence.
    Strictly handles BSON-to-Domain translation and query execution.
    Connection pooling and DB initialization are injected from the outside.
    """
    
    def __init__(self, collection: Collection):
        # DEPENDENCY INJECTION: We do not manage the MongoClient here.
        # We simply receive the specific Collection we need to work with.
        # This makes unit testing incredibly easy (we can inject a MockCollection).
        self._collection = collection

    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        logger.debug(f"Querying local MongoDB for barcode: {barcode}")
        try:
            document = self._collection.find_one({"barcode": barcode})
            
            if not document:
                return None
                
            return self._map_to_domain(document)
            
        except ConnectionFailure as e:
            logger.error(f"Lost connection to local MongoDB: {e}")
            return None
        except PyMongoError as e:
            logger.error(f"Database error reading barcode '{barcode}': {e}")
            return None

    def search_products_by_name(self, query: str) -> List[FoodItem]:
        logger.debug(f"Executing text search in local MongoDB for: '{query}'")
        try:
            # Requires a text index on the MongoDB collection: db.food_items.createIndex({"name": "text"})
            cursor = self._collection.find({"$text": {"$search": query}}).limit(10)
            
            results = []
            for doc in cursor:
                mapped_item = self._map_to_domain(doc)
                if mapped_item:
                    results.append(mapped_item)
                    
            return results
            
        except OperationFailure as e:
            # OperationFailure usually means the text index is missing or query is malformed
            logger.error(f"MongoDB search operation failed (Missing index?): {e}")
            return []
        except PyMongoError as e:
            logger.error(f"Database error during search for '{query}': {e}")
            return []

    def save_product(self, food_item: FoodItem) -> None:
        """
        Upserts the product into MongoDB. Fails silently (with logs) 
        to prevent caching issues from breaking the user experience.
        """
        try:
            document = food_item.model_dump()
            
            self._collection.update_one(
                {"barcode": food_item.barcode},
                {"$set": document},
                upsert=True
            )
            logger.debug(f"Cached product to MongoDB: {food_item.barcode}")
            
        except PyMongoError as e:
            logger.error(f"Failed to upsert product '{food_item.barcode}' to cache: {e}")

    def _map_to_domain(self, document: Dict[str, Any]) -> Optional[FoodItem]:
        """
        Isolates BSON-to-Domain translation.
        Safely removes MongoDB's internal ID before hydrating the Pydantic model.
        """
        try:
            # MongoDB injects an internal '_id' (ObjectId) which our Domain doesn't care about
            document.pop("_id", None)
            
            # Pydantic handles deep validation (types, constraints) automatically
            return FoodItem(**document)
            
        except Exception as e:
            # If the database data is corrupted and violates Pydantic rules, we catch it
            logger.warning(f"Data corruption detected in local cache document: {e}")
            return None