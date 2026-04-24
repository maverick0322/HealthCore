import logging
import requests
from src.domain.entities import FoodItem, NutritionalValues
from src.domain.ports import FoodCatalogPort
from src.domain.exceptions import FoodNotFoundError, ExternalServiceError

logger = logging.getLogger(__name__)

class OpenFoodFactsAdapter(FoodCatalogPort):
    
    BASE_URL: str = "https://world.openfoodfacts.org/api/v0/product/"

    def get_product_by_barcode(self, barcode: str) -> FoodItem:
        url = f"{self.BASE_URL}{barcode}.json"
        headers = {"User-Agent": "HealthCore/1.0 - Academic Project - Python"}

        try:
            logger.debug(f"Consultando API externa: {url}")
            response = requests.get(url, headers=headers, timeout=10.0)

            if response.status_code != 200:
                logger.error(f"El servidor rechazó la conexión. HTTP {response.status_code}")
                raise ExternalServiceError(f"HTTP Error {response.status_code}")

            data = response.json()
            
            if data.get("status") != 1:
                logger.warning(f"Producto {barcode} no encontrado en Open Food Facts.")
                raise FoodNotFoundError(f"El código {barcode} no existe en la base mundial.")

            product_data = data.get("product", {})
            nutriments = product_data.get("nutriments", {})

            def parse_nutrient(key: str) -> float:
                try:
                    val = nutriments.get(key)
                    return float(val) if val is not None and str(val).strip() != "" else 0.0
                except (ValueError, TypeError):
                    return 0.0

            nutrition = NutritionalValues(
                calories=parse_nutrient("energy-kcal_100g"),
                proteins=parse_nutrient("proteins_100g"),
                carbohydrates=parse_nutrient("carbohydrates_100g"),
                fats=parse_nutrient("fat_100g")
            )
            
            product_name = product_data.get("product_name", "Desconocido")
            logger.info(f"¡Éxito! Encontrado: {product_name}")

            return FoodItem(
                barcode=barcode,
                name=product_name,
                brand=product_data.get("brands", "Sin marca"),
                image_url=product_data.get("image_url"),
                nutrition=nutrition
            )

        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout en la API externa: {e}")
            raise ExternalServiceError("La API externa tardó demasiado en responder.")
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Fallo de conexión (DNS/Red) con Open Food Facts: {e}")
            raise ExternalServiceError("No se pudo establecer conexión con el catálogo externo.")
            
        except requests.exceptions.JSONDecodeError as e:
            logger.error(f"La API externa no devolvió un JSON válido: {e}")
            raise ExternalServiceError("Error procesando la respuesta del catálogo externo.")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error general de red conectando con la API: {e}")
            raise ExternalServiceError("Error de comunicación con el catálogo externo.")
            
        except ValueError as e:
            logger.exception("Error de validación de datos al construir la entidad FoodItem")
            raise ExternalServiceError("Los datos devueltos por el catálogo tienen un formato inválido.")
            
        except Exception as e:
            logger.exception(f"Error interno crítico inesperado procesando el código {barcode}")
            raise ExternalServiceError("Ocurrió un error inesperado en el servidor al procesar el alimento.")