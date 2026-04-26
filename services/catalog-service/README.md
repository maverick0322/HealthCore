# Nutritional Catalog Service - gRPC Provider

This is a high-performance Python microservice that acts as the source of truth for nutritional data. It communicates exclusively via gRPC (HTTP/2) and is designed to be consumed by other backend services (like the Tracking Service), not directly by the Frontend.

## 1) Environment Variables

```dotenv
# Port configuration for the gRPC server
GRPC_SERVER_PORT=50051
```

## 2) Start Services

To run this service in the Docker ecosystem:

```powershell
# Path to HealthCore root directory
Set-Location "~\HealthCore"

docker compose up -d --build catalog-service
docker compose logs -f catalog-service
```

## 3) gRPC Endpoints (Methods)

The service implements the NutritionalCatalog Protobuf definition.

### rpc GetFoodItem(FoodRequest) returns (FoodResponse)

- **Input:** Barcode string.
- **Output:** Base calories and macros per 100g.
- **Errors:** Returns `NOT_FOUND` if barcode does not exist, `INVALID_ARGUMENT` if barcode is empty.

### rpc SearchFood(SearchRequest) returns (SearchResponse)

- **Input:** Search query string (e.g., "Manzana").
- **Output:** List of matching food items.

## 4) Local Development & Testing

This service relies on `pytest` for unit testing and coverage.

### Setup virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Run Tests with Coverage

```bash
pytest --cov=. --cov-report=term-missing
```

This command will execute all unit tests and display a table showing exactly which lines of code are missing test coverage.