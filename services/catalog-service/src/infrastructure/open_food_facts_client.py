import requests
from src.domain.entities import FoodItem, NutritionalValues

class OpenFoodFactsClient:
    BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

    def get_product_by_barcode(self, barcode: str) -> FoodItem | None:
        url = f"{self.BASE_URL}{barcode}.json"
        response = requests.get(url)

        if response.status_code != 200:
            return None

        data = response.json()
        
        if data.get("status") != 1:
            return None

        product_data = data.get("product", {})
        nutriments = product_data.get("nutriments", {})

        nutrition = NutritionalValues(
            calories=nutriments.get("energy-kcal_100g", 0.0),
            proteins=nutriments.get("proteins_100g", 0.0),
            carbohydrates=nutriments.get("carbohydrates_100g", 0.0),
            fats=nutriments.get("fat_100g", 0.0)
        )

        return FoodItem(
            barcode=barcode,
            name=product_data.get("product_name", "Desconocido"),
            brand=product_data.get("brands", "Sin marca"),
            image_url=product_data.get("image_url"),
            nutrition=nutrition
        )