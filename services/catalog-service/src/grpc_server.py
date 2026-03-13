import grpc
from concurrent import futures
from src.interfaces import catalog_pb2_grpc
from src.interfaces.grpc_service import NutritionalCatalogService

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    catalog_pb2_grpc.add_NutritionalCatalogServicer_to_server(NutritionalCatalogService(), server)
    
    server.add_insecure_port('[::]:50051')
    
    print("Servidor gRPC de Catalog-Service iniciado en el puerto 50051...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()