import logging
import hashlib
from typing import List, Optional, Dict, Any
from pymongo import TEXT
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, ConnectionFailure, OperationFailure
from src.domain.entities import FoodItem
from src.domain.ports import LocalCatalogPort

logger = logging.getLogger(__name__)

# Design decision: Extracted magic number to constant for maintainability and easy configuration tweaking.
MAX_SEARCH_RESULTS = 10

class MongoLocalCatalogAdapter(LocalCatalogPort):
    """
    Driven Adapter for local MongoDB persistence.
    Strictly handles BSON-to-Domain translation and query execution.
    """
    
    def __init__(self, collection: Collection):
        self._collection = collection
        # Design decision: Compound text index optimizes wildcard searches for both name and brand
        self._collection.create_index([("name", TEXT), ("brand", TEXT)])

    def get_product_by_barcode(self, barcode: str) -> Optional[FoodItem]:
        logger.debug(f"Querying local MongoDB for barcodeHash: {self._hash_log(barcode)}")
        try:
            # Note: We return inactive records here so the Use Case can validate them during Admin updates.
            document = self._collection.find_one({"barcode": barcode})
            
            if not document:
                return None
                
            return self._map_to_domain(document)
            
        except ConnectionFailure as e:
            logger.error(f"Lost connection to MongoDB. barcodeHash: {self._hash_log(barcode)} - Error: {e}")
            return None
        except PyMongoError as e:
            logger.error(f"Database error reading barcodeHash: {self._hash_log(barcode)} - Error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected critical error in get_product. barcodeHash: {self._hash_log(barcode)} - Error: {e}")
            return None

    def search_products_by_name(self, query: str) -> List[FoodItem]:
        try:
            # Design decision: Push 'is_active' filter to DB. 
            # If done in memory, a limit(10) cursor might return 10 inactive items, leaving the user with 0 results.
            flexible_query = {
                "is_active": True,
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"brand": {"$regex": query, "$options": "i"}}
                ]
            }
            
            cursor = self._collection.find(flexible_query).limit(MAX_SEARCH_RESULTS)
            
            results = []
            for doc in cursor:
                mapped_item = self._map_to_domain(doc)
                if mapped_item:
                    results.append(mapped_item)
                    
            return results
            
        except OperationFailure as e:
            logger.error(f"MongoDB search operation failed. queryHash: {self._hash_log(query)} - Error: {e}")
            return []
        except PyMongoError as e:
            logger.error(f"Database error during search. queryHash: {self._hash_log(query)} - Error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during search. queryHash: {self._hash_log(query)} - Error: {e}")
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
            
        except PyMongoError as e:
            logger.error(f"Failed to upsert product cache. barcodeHash: {self._hash_log(food_item.barcode)} - Error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error saving product. barcodeHash: {self._hash_log(food_item.barcode)} - Error: {e}")

    def _map_to_domain(self, document: Dict[str, Any]) -> Optional[FoodItem]:
        """
        Isolates BSON-to-Domain translation safely.
        """
        try:
            document.pop("_id", None)
            return FoodItem(**document)
            
        except ValueError as e:
            # Catches Pydantic specific validation errors separately
            logger.warning(f"Data validation error in cache document: {e}")
            return None
        except Exception as e:
            logger.warning(f"Data corruption detected in cache document: {e}")
            return None

    def _hash_log(self, value: str) -> str:
        """
        Design decision: Anonymizes sensitive search strings or identifiers 
        using SHA-256 to comply with non-trackable PII standards.
        """
        if not value:
            return "unknown"
        return hashlib.sha256(value.encode('utf-8')).hexdigest()[:8]