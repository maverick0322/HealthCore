import os
import sys
import grpc
import signal
import logging
from concurrent import futures

from src.interfaces import catalog_pb2_grpc
from src.interfaces.grpc_service import NutritionalCatalogService
from src.infrastructure.open_food_facts_client import OpenFoodFactsAdapter
from src.application.catalog_use_case import CatalogUseCase

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# 12-FACTOR APP: Configuration via Environment Variables prevents hardcoded magic numbers.
# Defaults are provided for local development without .env files.
PORT = os.getenv("GRPC_PORT", "50051")
MAX_WORKERS = int(os.getenv("GRPC_MAX_WORKERS", "10"))
SHUTDOWN_GRACE_PERIOD = float(os.getenv("GRPC_SHUTDOWN_GRACE_PERIOD", "5.0"))

def serve():
    """
    COMPOSITION ROOT: This is the only file in the application aware of all layers.
    We wire up the dependencies here to keep the inner domain and application layers 
    completely decoupled from concrete infrastructure implementations.
    """
    try:
        catalog_adapter = OpenFoodFactsAdapter()
        use_case = CatalogUseCase(catalog_port=catalog_adapter)
        grpc_servicer = NutritionalCatalogService(use_case=use_case)
    except Exception:
        logger.critical("Critical failure during Dependency Injection wiring.", exc_info=True)
        sys.exit(1)

    # Initialize the gRPC server with a thread pool to handle concurrent incoming RPCs
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
        """
        Intercepts OS signals to ensure in-flight requests finish before the container dies.
        Prevents data corruption or dropped connections during scaling/deployments.
        """
        logger.warning(f"OS Signal ({signum}) received. Commencing graceful shutdown...")
        
        shutdown_event = server.stop(grace=SHUTDOWN_GRACE_PERIOD)
        shutdown_event.wait()
        
        logger.info("gRPC Server gracefully shut down. Goodbye!")
        sys.exit(0)

    # SIGTERM is standard for container orchestration engines (Docker stop / Kubernetes pod eviction)
    signal.signal(signal.SIGTERM, handle_shutdown_signal)
    signal.signal(signal.SIGINT, handle_shutdown_signal)

    try:
        # Block the main thread to keep the server running
        server.wait_for_termination()
    except Exception:
        logger.critical("Unexpected crash in the server's main event loop.", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    serve()