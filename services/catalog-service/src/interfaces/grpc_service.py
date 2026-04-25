import grpc
import logging
from src.interfaces import catalog_pb2
from src.interfaces import catalog_pb2_grpc
from src.application.catalog_use_case import CatalogUseCase
from src.domain.exceptions import FoodNotFoundError, ExternalServiceError

logger = logging.getLogger(__name__)

class NutritionalCatalogService(catalog_pb2_grpc.NutritionalCatalogServicer):
    
    def __init__(self, use_case: CatalogUseCase):
        self._use_case = use_case

    def GetFoodItem(self, request, context):
        safe_barcode = request.barcode.strip() if request.barcode else ""
        logger.info(f"Recibida petición gRPC para el código: '{safe_barcode}'")
        
        if not safe_barcode:
            msg = "El código de barras proporcionado está vacío o es inválido."
            logger.warning(msg)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(msg)
            return catalog_pb2.FoodResponse()

        try:
            product = self._use_case.find_food(safe_barcode)

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

        except FoodNotFoundError as e:
            logger.warning(f"Búsqueda sin resultados: {e}")
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(e))
            return catalog_pb2.FoodResponse()
            
        except ExternalServiceError as e:
            logger.error(f"Fallo en dependencia externa: {e}")
            context.set_code(grpc.StatusCode.UNAVAILABLE)
            context.set_details(str(e))
            return catalog_pb2.FoodResponse()

        except ValueError as e:
            logger.error(f"Error de validación interna procesando el código {safe_barcode}: {e}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Los datos del producto tienen un formato numérico inválido.")
            return catalog_pb2.FoodResponse()

        except Exception as e:
            logger.exception(f"Error interno crítico y no controlado procesando el código {safe_barcode}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Ocurrió un error interno crítico en el servidor de catálogo. Intente más tarde.")
            return catalog_pb2.FoodResponse()

    def SearchFood(self, request, context):
        query = request.query.strip() if request.query else ""
        logger.info(f"Iniciando búsqueda gRPC para: '{query}'")
        
        try:
            products = self._use_case.search_food(query)

            grpc_results = [
                catalog_pb2.FoodResponse(
                    barcode=p.barcode,
                    name=p.name,
                    brand=p.brand,
                    image_url=p.image_url,
                    calories_per_100g=p.nutrition.calories,
                    proteins_per_100g=p.nutrition.proteins,
                    carbs_per_100g=p.nutrition.carbohydrates,
                    fats_per_100g=p.nutrition.fats,
                    source="Open Food Facts"
                ) for p in products
            ]

            return catalog_pb2.SearchResponse(items=grpc_results)

        except Exception as e:
            logger.error(f"Error crítico en SearchFood: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Error interno al buscar alimentos.")
            return catalog_pb2.SearchResponse()