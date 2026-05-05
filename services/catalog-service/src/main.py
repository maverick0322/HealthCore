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

# Nuevas dependencias
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

# Patrón Singleton para la conexión a MongoDB y el UseCase
# Esto evita abrir una nueva conexión a la base de datos por cada petición HTTP
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

# ... (Mantén el resto de tu código de main.py intacto a partir de aquí: diccionarios y endpoints) ...