import requests
from src.domain.entities import FoodItem, NutritionalValues

class OpenFoodFactsClient:
    BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

    def get_product_by_barcode(self, barcode: str) -> FoodItem | None:
        url = f"{self.BASE_URL}{barcode}.json"
        
        headers = {
            "User-Agent": "HealthCore/1.0 - Academic Project - Python"
        }

        try:
            print(f"\n[OpenFoodFacts] Buscando código de barras: {barcode}...")
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"[OpenFoodFacts] El servidor rechazó la conexión. HTTP {response.status_code}")
                return None

            data = response.json()
            
            if data.get("status") != 1:
                print(f"[OpenFoodFacts] El producto {barcode} no está en la base de datos mundial.")
                return None

            product_data = data.get("product", {})
            nutriments = product_data.get("nutriments", {})

            def parse_nutrient(key):
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
            print(f"[OpenFoodFacts] ¡Éxito! Encontrado: {product_name}")

            return FoodItem(
                barcode=barcode,
                name=product_name,
                brand=product_data.get("brands", "Sin marca"),
                image_url=product_data.get("image_url"),
                nutrition=nutrition
            )

        except requests.exceptions.Timeout as e:
            print(f"[OpenFoodFacts] Timeout: La API tardó demasiado en responder. Detalle: {e}")
            return None
            
        except requests.exceptions.ConnectionError as e:
            print(f"[OpenFoodFacts] Error de Conexión física con Open Food Facts. Detalle: {e}")
            return None
            
        except requests.exceptions.JSONDecodeError as e:
            print(f"[OpenFoodFacts] Error de Formato: La API no devolvió un JSON válido. Detalle: {e}")
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"[OpenFoodFacts] Error general de red conectando con la API. Detalle: {e}")
            return None
            
        except Exception as e:
            print(f"[OpenFoodFacts] Error interno inesperado procesando el producto. Detalle: {e}")
            return None