import grpc
import logging
from src.interfaces import catalog_pb2
from src.interfaces import catalog_pb2_grpc
from src.application.catalog_use_case import CatalogUseCase
from src.domain.entities import FoodItem
from src.domain.exceptions import (
    FoodNotFoundError, 
    ExternalServiceUnavailableError, 
    InvalidDomainDataError
)

logger = logging.getLogger(__name__)

# ADAPTER PATTERN (Driving/Primary Adapter): Isolates the gRPC delivery mechanism from the core domain.
# This ensures that our business logic remains completely agnostic to the network protocol,
# allowing us to seamlessly swap or add new interfaces in the future without modifying core rules.
class NutritionalCatalogService(catalog_pb2_grpc.NutritionalCatalogServicer):
    """
    gRPC Delivery mechanism. 
    Acts purely as an adapter between the network protocol and the application use cases.
    """
    
    def __init__(self, use_case: CatalogUseCase):
        self._use_case = use_case

    def GetFoodItem(self, request, context):
        logger.info(f"Processing GetFoodItem RPC for barcode: '{request.barcode}'")
        
        try:
            product = self._use_case.find_food(request.barcode)
            return self._map_to_grpc_response(product)

        except InvalidDomainDataError as e:
            logger.warning(f"Validation failed for GetFoodItem: {e}")
            return self._handle_grpc_error(context, grpc.StatusCode.INVALID_ARGUMENT, str(e), catalog_pb2.FoodResponse())
            
        except FoodNotFoundError as e:
            logger.warning(f"Barcode not found: {e}")
            return self._handle_grpc_error(context, grpc.StatusCode.NOT_FOUND, str(e), catalog_pb2.FoodResponse())
            
        except ExternalServiceUnavailableError as e:
            # We log the internal_reason if available for debugging, but send the safe str(e) to the client
            logger.error(f"Provider/Local cache failure: {getattr(e, 'internal_reason', str(e))}")
            return self._handle_grpc_error(context, grpc.StatusCode.UNAVAILABLE, str(e), catalog_pb2.FoodResponse())
            
        except Exception as e:
            logger.exception("Unhandled critical error in GetFoodItem RPC.")
            return self._handle_grpc_error(
                context, 
                grpc.StatusCode.INTERNAL, 
                "Ocurrió un error inesperado en el servidor. Inténtelo más tarde.", 
                catalog_pb2.FoodResponse()
            )


    def SearchFood(self, request, context):
        logger.info(f"Processing SearchFood RPC for query: '{request.query}'")
        
        try:
            products = self._use_case.search_food(request.query)
            
            # Map domain entities to gRPC messages using the helper method
            grpc_results = [self._map_to_grpc_response(p) for p in products]
            return catalog_pb2.SearchResponse(items=grpc_results)

        except InvalidDomainDataError as e:
            logger.warning(f"Validation failed for SearchFood: {e}")
            return self._handle_grpc_error(context, grpc.StatusCode.INVALID_ARGUMENT, str(e), catalog_pb2.SearchResponse())
            
        except ExternalServiceUnavailableError as e:
            logger.error(f"Provider/Local cache failure during search: {getattr(e, 'internal_reason', str(e))}")
            return self._handle_grpc_error(context, grpc.StatusCode.UNAVAILABLE, str(e), catalog_pb2.SearchResponse())
            
        except Exception as e:
            logger.exception("Unhandled critical error in SearchFood RPC.")
            return self._handle_grpc_error(
                context, 
                grpc.StatusCode.INTERNAL, 
                "Ocurrió un error inesperado en el servidor. Inténtelo más tarde.", 
                catalog_pb2.SearchResponse()
            )
        

    def _map_to_grpc_response(self, product: FoodItem) -> catalog_pb2.FoodResponse:
        """
        Isolates the data transformation logic from Domain Entity to gRPC Protobuf.
        Prevents code duplication across multiple RPC methods and includes new clinical micronutrients.
        """
        return catalog_pb2.FoodResponse(
            barcode=product.barcode,
            name=product.name,
            brand=product.brand,
            image_url=product.image_url or "",
            calories_per_100g=product.nutrition.calories,
            proteins_per_100g=product.nutrition.proteins,
            carbs_per_100g=product.nutrition.carbohydrates,
            fats_per_100g=product.nutrition.fats,
            fiber_grams_per_100g=product.nutrition.fiber_grams,
            sodium_mg_per_100g=product.nutrition.sodium_mg,
            sugar_grams_per_100g=product.nutrition.sugar_grams,
            potassium_mg_per_100g=product.nutrition.potassium_mg
        )

    def _handle_grpc_error(self, context, status_code: grpc.StatusCode, detail: str, empty_response_obj):
        """
        Centralizes the mutation of the gRPC context to reduce cyclomatic complexity 
        in the main RPC methods.
        """
        context.set_code(status_code)
        context.set_details(detail)
        return empty_response_obj