from fastapi import FastAPI, HTTPException
from src.infrastructure.open_food_facts_client import OpenFoodFactsClient
from src.domain.entities import FoodItem

app = FastAPI(
    title="HealthCore - Catalog Service",
    description="Microservicio de Catálogo de Alimentos (Python)",
    version="1.0.0"
)

off_client = OpenFoodFactsClient()

@app.get("/api/v1/catalog/health")
def health_check():
    return {"status": "success", "message": "¡El Catálogo está vivo!"}

@app.get("/api/v1/catalog/products/{barcode}", response_model=FoodItem)
def get_product(barcode: str):
    product = off_client.get_product_by_barcode(barcode)
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado en la base de datos mundial")
        
    return product