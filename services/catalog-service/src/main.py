from fastapi import FastAPI

app = FastAPI(
    title="HealthCore - Catalog Service",
    description="Microservicio de Catálogo de Alimentos (Python)",
    version="1.0.0"
)

@app.get("/api/v1/catalog/health")
def health_check():
    return {
        "status": "success",
        "service": "catalog-service",
        "message": "¡El Catálogo de Alimentos está vivo y listo para procesar macros!"
    }