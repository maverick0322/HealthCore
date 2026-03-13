import grpc
from src.interfaces import catalog_pb2
from src.interfaces import catalog_pb2_grpc
from src.infrastructure.open_food_facts_client import OpenFoodFactsClient

class NutritionalCatalogService(catalog_pb2_grpc.NutritionalCatalogServicer):
    
    def __init__(self):
        self.off_client = OpenFoodFactsClient()

    def GetFoodItem(self, request, context):
        print(f"[gRPC] Recibida petición para el código: {request.barcode}")
        
        product = self.off_client.get_product_by_barcode(request.barcode)

        if not product:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Producto no encontrado en la base de datos mundial')
            return catalog_pb2.FoodResponse()

        return catalog_pb2.FoodResponse(
            barcode=product.barcode,
            name=product.name,
            brand=product.brand or "Sin marca",
            image_url=product.image_url or "",
            calories_per_100g=product.nutrition.calories,
            proteins_per_100g=product.nutrition.proteins,
            carbs_per_100g=product.nutrition.carbohydrates,
            fats_per_100g=product.nutrition.fats,
            source="Open Food Facts" 
        )

    def SearchFood(self, request, context):
        print(f"[gRPC] Búsqueda solicitada: {request.query}")
        return catalog_pb2.SearchResponse(items=[])