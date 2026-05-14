import os
import logging
from typing import List, Annotated
from fastapi import FastAPI, HTTPException, Path, Query, Depends
from pymongo import MongoClient

from src.application.catalog_use_case import CatalogUseCase
from src.domain.entities import FoodItem
from src.domain.exceptions import (
    FoodNotFoundError, 
    ExternalServiceUnavailableError, 
    InvalidDomainDataError
)

from src.infrastructure.mongo_local_adapter import MongoLocalCatalogAdapter
from src.infrastructure.fatsecret.fatsecret_authenticator import FatSecretAuthenticator
from src.infrastructure.fatsecret.fatsecret_mapper import FatSecretMapper
from src.infrastructure.fatsecret.fatsecret_adapter import FatSecretAdapter

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HealthCore - Catalog Service (REST)", 
    description="API REST component of the Food Catalog Microservice",
    version="1.0.0"
)

# Singleton Pattern for Use Case instance 
_use_case_instance = None

def get_catalog_use_case() -> CatalogUseCase:
    """Dependency Provider for FastAPI."""
    global _use_case_instance
    if _use_case_instance is not None:
        return _use_case_instance

    try:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "healthcore")
        mongo_client = MongoClient(mongo_uri)
        local_adapter = MongoLocalCatalogAdapter(collection=mongo_client[db_name]["catalog"])

        authenticator = FatSecretAuthenticator(
            client_id=os.getenv("FATSECRET_CLIENT_ID", ""),
            client_secret=os.getenv("FATSECRET_CLIENT_SECRET", ""),
            token_url="https://oauth.fatsecret.com/connect/token"
        )
        external_adapter = FatSecretAdapter(
            api_url="https://platform.fatsecret.com/rest/server.api",
            authenticator=authenticator,
            mapper=FatSecretMapper()
        )

        _use_case_instance = CatalogUseCase(local_port=local_adapter, external_port=external_adapter)
        return _use_case_instance
        
    except Exception:
        logger.critical("Dependency Injection failed during FastAPI startup.", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server configuration error.")

UseCaseDep = Annotated[CatalogUseCase, Depends(get_catalog_use_case)]

# OpenAPI Documentation Dictionaries
COMMON_RESPONSES = {
    500: {"description": "Internal Server Error - Unexpected critical failure."},
    503: {"description": "Service Unavailable - Upstream catalog is down."}
}

GET_PRODUCT_RESPONSES = {
    **COMMON_RESPONSES,
    400: {"description": "Bad Request - Invalid barcode format or empty string."},
    404: {"description": "Not Found - The requested barcode does not exist in the catalog."}
}

SEARCH_RESPONSES = {
    **COMMON_RESPONSES,
    400: {"description": "Bad Request - Search query cannot be empty or just whitespace."}
}

@app.get("/api/v1/catalog/health", tags=["Monitoring"])
def health_check():
    return {"status": "success", "message": "Catalog REST API is up and running!"}

@app.get(
    "/api/v1/catalog/products/{barcode}", 
    response_model=FoodItem, 
    tags=["Catalog"],
    responses=GET_PRODUCT_RESPONSES 
)
def get_product(
    barcode: Annotated[str, Path(title="Barcode", min_length=1)],
    use_case: UseCaseDep
):
    logger.info(f"Processing REST GET request for barcode: '{barcode}'")
    
    try:
        return use_case.find_food(barcode)
        
    except InvalidDomainDataError as e:
        logger.warning(f"REST Validation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except FoodNotFoundError as e:
        logger.warning(f"REST Search yielded no results: {e}")
        raise HTTPException(status_code=404, detail=str(e))
        
    except ExternalServiceUnavailableError as e:
        logger.error(f"Upstream provider failure via REST: {e}")
        raise HTTPException(status_code=503, detail=str(e))
        
    except Exception:
        logger.exception("Unhandled critical error in REST get_product endpoint.")
        raise HTTPException(
            status_code=500, 
            detail="An internal server error occurred. Please try again later."
        )

@app.get(
    "/api/v1/catalog/search", 
    response_model=List[FoodItem], 
    tags=["Catalog"],
    responses=SEARCH_RESPONSES
)
def search_products(
    query: Annotated[str, Query(title="Search Query", min_length=1)],
    use_case: UseCaseDep
):
    """
    Text-based search endpoint to ensure feature parity with the gRPC interface.
    """
    logger.info(f"Processing REST GET request to search: '{query}'")
    
    try:
        return use_case.search_food(query)
        
    except InvalidDomainDataError as e:
        logger.warning(f"REST Validation failed for search: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except ExternalServiceUnavailableError as e:
        logger.error(f"Upstream provider failure during REST search: {e}")
        raise HTTPException(status_code=503, detail=str(e))
        
    except Exception:
        logger.exception("Unhandled critical error in REST search_products endpoint.")
        raise HTTPException(
            status_code=500, 
            detail="An internal server error occurred. Please try again later."
        )