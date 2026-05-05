import os
import sys
import grpc
import signal
import logging
from concurrent import futures
from pymongo import MongoClient

from src.interfaces import catalog_pb2_grpc
from src.interfaces.grpc_service import NutritionalCatalogService
from src.application.catalog_use_case import CatalogUseCase

# Nuestras nuevas dependencias de infraestructura
from src.infrastructure.mongo_local_adapter import MongoLocalCatalogAdapter
from src.infrastructure.fatsecret.fatsecret_authenticator import FatSecretAuthenticator
from src.infrastructure.fatsecret.fatsecret_mapper import FatSecretMapper
from src.infrastructure.fatsecret.fatsecret_adapter import FatSecretAdapter

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

PORT = os.getenv("GRPC_PORT", "50051")
MAX_WORKERS = int(os.getenv("GRPC_MAX_WORKERS", "10"))
SHUTDOWN_GRACE_PERIOD = float(os.getenv("GRPC_SHUTDOWN_GRACE_PERIOD", "5.0"))

def serve():
    """
    COMPOSITION ROOT: We wire up the new MongoDB and FatSecret dependencies here.
    """
    try:
        # 1. Configurar MongoDB (Local Port)
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "healthcore")
        mongo_client = MongoClient(mongo_uri)
        db = mongo_client[db_name]
        local_adapter = MongoLocalCatalogAdapter(collection=db["catalog"])

        # 2. Configurar FatSecret (External Port)
        fs_client_id = os.getenv("FATSECRET_CLIENT_ID")
        fs_client_secret = os.getenv("FATSECRET_CLIENT_SECRET")
        
        if not fs_client_id or not fs_client_secret:
            logger.critical("FATSECRET credentials are missing in Environment Variables!")
            sys.exit(1)

        authenticator = FatSecretAuthenticator(
            client_id=fs_client_id,
            client_secret=fs_client_secret,
            token_url="https://oauth.fatsecret.com/connect/token"
        )
        mapper = FatSecretMapper()
        external_adapter = FatSecretAdapter(
            api_url="https://platform.fatsecret.com/rest/server.api",
            authenticator=authenticator,
            mapper=mapper
        )

        # 3. Inyectar ambos puertos al Caso de Uso (Cache-Aside pattern)
        use_case = CatalogUseCase(local_port=local_adapter, external_port=external_adapter)
        
        # 4. Iniciar servicio gRPC
        grpc_servicer = NutritionalCatalogService(use_case=use_case)
        
    except Exception:
        logger.critical("Critical failure during Dependency Injection wiring.", exc_info=True)
        sys.exit(1)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    catalog_pb2_grpc.add_NutritionalCatalogServicer_to_server(grpc_servicer, server)
    
    try:
        server.add_insecure_port(f'[::]:{PORT}')
        server.start()
        logger.info(f"Catalog gRPC Server listening on port {PORT} with {MAX_WORKERS} workers...")
    except Exception:
        logger.critical(f"Failed to bind or start the gRPC server on port {PORT}.", exc_info=True)
        sys.exit(1)

    def handle_shutdown_signal(signum, frame):
        logger.warning(f"OS Signal ({signum}) received. Commencing graceful shutdown...")
        mongo_client.close() # Cerramos conexión a DB limpiamente
        shutdown_event = server.stop(grace=SHUTDOWN_GRACE_PERIOD)
        shutdown_event.wait()
        logger.info("gRPC Server gracefully shut down. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_shutdown_signal)
    signal.signal(signal.SIGINT, handle_shutdown_signal)

    try:
        server.wait_for_termination()
    except Exception:
        logger.critical("Unexpected crash in the server's main event loop.", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    serve()