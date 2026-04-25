import logging
import requests
from typing import List, Optional, Dict, Any
from src.domain.entities import FoodItem, NutritionalValues
from src.domain.ports import FoodCatalogPort
from src.domain.exceptions import FoodNotFoundError, ExternalServiceError

logger = logging.getLogger(__name__)

class OpenFoodFactsAdapter(FoodCatalogPort):
    
    BASE_URL: str = "https://world.openfoodfacts.org/api/v0/product/"
    SEARCH_URL: str = "https://world.openfoodfacts.org/cgi/search.pl"

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
        
    def search_products_by_name(self, query: str) -> List[FoodItem]:
        """Orquesta la búsqueda de productos manejando exclusivamente la capa HTTP."""
        params = {
            "search_terms": query,
            "search_simple": "1",
            "action": "process",
            "json": "1",
            "page_size": "5"
        }
        headers = {"User-Agent": "NutriTrack_Project/1.0 (estudiante@healthcore.com)"}

        try:
            logger.debug(f"Consultando API de búsqueda: {query}")
            response = requests.get(self.SEARCH_URL, params=params, headers=headers, timeout=10.0)

            if response.status_code in [502, 503, 504]:
                logger.warning(f"La API falló (HTTP {response.status_code}). Activando modo offline temporal.")
                return self._get_fallback_response(query)

            response.raise_for_status()

            data = response.json()
            products_data = data.get("products", [])
            
            if not products_data:
                logger.warning(f"No se encontraron resultados para: {query}")
                return [] 

            results = []
            for item in products_data:
                food_item = self._map_to_food_item(item)
                if food_item:
                    results.append(food_item)

            logger.info(f"Éxito: Se encontraron {len(results)} resultados para '{query}'")
            return results

        # --- Bloque Defensivo de Excepciones Detalladas ---
        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout buscando '{query}': {e}")
            raise ExternalServiceError("La búsqueda tardó demasiado en responder.")
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Error de conexión (DNS/Red) buscando '{query}': {e}")
            raise ExternalServiceError("No se pudo establecer conexión con el catálogo externo.")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Error HTTP {e.response.status_code} buscando '{query}': {e}")
            raise ExternalServiceError(f"El catálogo externo rechazó la petición (HTTP {e.response.status_code}).")
            
        except requests.exceptions.JSONDecodeError as e:
            logger.error(f"El servidor no devolvió un JSON válido buscando '{query}': {e}")
            raise ExternalServiceError("Error procesando la respuesta del catálogo externo.")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error general de red conectando con la API de búsqueda: {e}")
            raise ExternalServiceError("Fallo inesperado de red durante la búsqueda.")
            
        except Exception as e:
            logger.exception(f"Error interno crítico inesperado procesando la búsqueda de '{query}'")
            raise ExternalServiceError("Ocurrió un error interno en el servidor al buscar alimentos.")


    def _map_to_food_item(self, item: Dict[str, Any]) -> Optional[FoodItem]:
        """Evalúa un diccionario raw y construye una entidad FoodItem si cumple los requisitos."""
        barcode = item.get("code") or item.get("_id")
        product_name = item.get("product_name")
        
        if not barcode or not product_name:
            return None

        nutriments = item.get("nutriments", {})
        
        nutrition = NutritionalValues(
            calories=self._safe_extract_nutrient(nutriments, "energy-kcal_100g"),
            proteins=self._safe_extract_nutrient(nutriments, "proteins_100g"),
            carbohydrates=self._safe_extract_nutrient(nutriments, "carbohydrates_100g"),
            fats=self._safe_extract_nutrient(nutriments, "fat_100g")
        )
        
        img_url = item.get("image_front_small_url") or item.get("image_url") or ""

        return FoodItem(
            barcode=str(barcode),
            name=product_name,
            brand=item.get("brands", "Sin marca"),
            image_url=img_url,
            nutrition=nutrition
        )

    def _safe_extract_nutrient(self, nutriments: Dict[str, Any], key: str) -> float:
        """Aísla la lógica de conversión y limpieza de datos numéricos corruptos."""
        try:
            val = nutriments.get(key)
            return float(val) if val is not None and str(val).strip() != "" else 0.0
        except (ValueError, TypeError):
            return 0.0

    def _get_fallback_response(self, query: str) -> List[FoodItem]:
        """Aísla los datos hardcodeados del paracaídas de resiliencia."""
        return [
            FoodItem(
                barcode="7622300710606",
                name=f"{query.capitalize()} (Servidor OFF)",
                brand="Nabisco",
                image_url="https://images.openfoodfacts.org/images/products/762/230/071/0606/front_es.127.400.jpg",
                nutrition=NutritionalValues(calories=480.0, proteins=5.0, carbohydrates=68.0, fats=20.0)
            )
        ]