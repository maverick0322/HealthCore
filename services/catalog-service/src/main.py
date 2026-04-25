import logging
from fastapi import FastAPI, HTTPException, Path, Depends
from src.infrastructure.open_food_facts_client import OpenFoodFactsAdapter
from src.application.catalog_use_case import CatalogUseCase
from src.domain.entities import FoodItem
from src.domain.exceptions import FoodNotFoundError, ExternalServiceError

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HealthCore - Catalog Service", 
    description="API REST y microservicio de catálogo de alimentos",
    version="1.0.0"
)

# ------------------------------------------------------------------------
# Dependency Container (Inversion of Control for FastAPI)
# ------------------------------------------------------------------------
def get_catalog_use_case() -> CatalogUseCase:
    """
    Proveedor de dependencias. FastAPI llamará a esta función para inyectar 
    el Caso de Uso en las rutas. Ideal para mockear en pruebas unitarias.
    """
    try:
        catalog_adapter = OpenFoodFactsAdapter()
        return CatalogUseCase(catalog_port=catalog_adapter)
    except Exception as e:
        logger.critical(f"Fallo al inicializar las dependencias del catálogo: {e}")
        raise HTTPException(status_code=500, detail="Error interno de configuración del servidor.")


# ------------------------------------------------------------------------
# (Endpoints)
# ------------------------------------------------------------------------
@app.get("/api/v1/catalog/health", tags=["Monitoring"])
def health_check():
    return {"status": "success", "message": "¡El Catálogo (FastAPI) está vivo!"}


@app.get("/api/v1/catalog/products/{barcode}", response_model=FoodItem, tags=["Catalog"])
def get_product(
    barcode: str = Path(..., title="Código de Barras", min_length=3, max_length=20),
    use_case: CatalogUseCase = Depends(get_catalog_use_case)
):
    safe_barcode = barcode.strip()
    logger.info(f"Petición REST recibida para el código: '{safe_barcode}'")
    
    try:
        return use_case.find_food(safe_barcode)
        
    except FoodNotFoundError as e:
        logger.warning(f"Búsqueda REST sin resultados: {e}")
        raise HTTPException(status_code=404, detail=str(e))
        
    except ExternalServiceError as e:
        logger.error(f"Fallo en dependencia externa vía REST: {e}")
        raise HTTPException(status_code=503, detail=str(e))
        
    except ValueError as e:
        logger.error(f"Error de validación de datos para el código {safe_barcode}: {e}")
        raise HTTPException(status_code=400, detail="El formato de datos del producto es inválido.")
        
    except Exception as e:
        logger.exception(f"Error interno crítico en API REST procesando el código {safe_barcode}")
        raise HTTPException(
            status_code=500, 
            detail="Ocurrió un error interno crítico en el servidor. Intente más tarde."
        )