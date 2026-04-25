import logging
from typing import List, Annotated
from fastapi import FastAPI, HTTPException, Path, Query, Depends

from src.infrastructure.open_food_facts_client import OpenFoodFactsAdapter
from src.application.catalog_use_case import CatalogUseCase
from src.domain.entities import FoodItem
from src.domain.exceptions import (
    FoodNotFoundError, 
    ExternalServiceUnavailableError, 
    InvalidDomainDataError
)

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


def get_catalog_use_case() -> CatalogUseCase:
    """Dependency Provider for FastAPI."""
    try:
        catalog_adapter = OpenFoodFactsAdapter()
        return CatalogUseCase(catalog_port=catalog_adapter)
    except Exception:
        logger.critical("Dependency Injection failed during FastAPI startup.", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server configuration error.")

UseCaseDep = Annotated[CatalogUseCase, Depends(get_catalog_use_case)]

# OpenAPI Documentation Dictionaries
COMMON_RESPONSES = {
    500: {"description": "Internal Server Error - Unexpected critical failure."},
    503: {"description": "Service Unavailable - Upstream catalog (OpenFoodFacts) is down."}
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