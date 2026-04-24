import grpc
import logging
import signal
import sys
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

def serve():
    try:
        catalog_adapter = OpenFoodFactsAdapter()
        use_case = CatalogUseCase(catalog_port=catalog_adapter)
        grpc_servicer = NutritionalCatalogService(use_case=use_case)
    except Exception as e:
        logger.critical(f"Fallo crítico al inicializar las dependencias: {e}")
        sys.exit(1)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    catalog_pb2_grpc.add_NutritionalCatalogServicer_to_server(grpc_servicer, server)
    
    port = '50051'
    try:
        server.add_insecure_port(f'[::]:{port}')
        server.start()
        logger.info(f"Servidor gRPC de Catalog-Service iniciado en el puerto {port}...")
    except Exception as e:
        logger.critical(f"No se pudo levantar el servidor en el puerto {port}. Detalle: {e}")
        sys.exit(1)

    def handle_shutdown_signal(signum, frame):
        logger.warning(f"Recibida señal del sistema ({signum}). Iniciando apagado elegante...")
        
        shutdown_event = server.stop(grace=5.0)
        shutdown_event.wait()
        
        logger.info("Servidor gRPC apagado correctamente. ¡Adiós!")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_shutdown_signal)
    signal.signal(signal.SIGINT, handle_shutdown_signal)

    try:
        server.wait_for_termination()
    except Exception as e:
        logger.critical(f"Caída inesperada en el hilo principal del servidor: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    serve()