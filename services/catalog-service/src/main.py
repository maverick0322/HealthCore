import logging
from fastapi import FastAPI, HTTPException
from src.infrastructure.open_food_facts_client import OpenFoodFactsAdapter
from src.application.catalog_use_case import CatalogUseCase
from src.domain.entities import FoodItem
from src.domain.exceptions import FoodNotFoundError, ExternalServiceError

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')

app = FastAPI(title="HealthCore - Catalog Service", version="1.0.0")

catalog_adapter = OpenFoodFactsAdapter()
catalog_use_case = CatalogUseCase(catalog_port=catalog_adapter)

@app.get("/api/v1/catalog/health")
def health_check():
    return {"status": "success", "message": "¡El Catálogo está vivo!"}

@app.get("/api/v1/catalog/products/{barcode}", response_model=FoodItem)
def get_product(barcode: str):
    try:
        return catalog_use_case.find_food(barcode)
    except FoodNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ExternalServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))