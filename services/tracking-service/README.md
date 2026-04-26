# Tracking Service - Frontend Integration & Architecture Guide

This guide summarizes the minimum setup, request flow, and architectural details for the Tracking Service. This service utilizes a Clean/Hexagonal Architecture to log user food consumption and calculate macronutrients, relying on a gRPC connection to the Catalog Service.

## 1) Environment Variables

Set these values in your compose `.env` file or environment.

```dotenv
# Security
JWT_SECRET=REPLACE_WITH_A_STRONG_SECRET_32B_OR_MORE

# Database
SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/healthcore_tracking

# External gRPC Services
GRPC_CATALOG_TARGET=catalog-service:50051

# Logging (Development)
LOGGING_LEVEL_COM_HEALTHCORE_TRACKING=DEBUG
```

## 2) Start Services

The Tracking Service depends on MongoDB and the Catalog Service (Python). To start the ecosystem:

```powershell
# Path to HealthCore root directory
Set-Location "~\HealthCore"

docker compose up -d --build mongodb catalog-service tracking-service
docker compose logs -f tracking-service
```

## 3) REST Endpoints for Frontend

**Base URL:** `http://localhost:8080/api/v1/tracking`

### Catalog Queries (Read-Only)

- `GET /catalog/{barcode}`: Fetches precise nutritional data for a specific barcode.
- `GET /catalog/search?query=Oreo`: Searches the catalog by product name (requires at least 3 characters).

### Consumption Logging

- `POST /logs/food`: Logs a new food entry and calculates total macros based on grams.
- `GET /logs/today`: Retrieves all food logs for the authenticated user for the current day.

### Example: Logging Food Payload

**POST** `/api/v1/tracking/logs/food`

```json
{
  "barcode": "7622300336738",
  "grams": 250.0
}
```

> **Note:** The `userId` is securely extracted from the JWT Bearer Token, not the request body.

## 4) OpenAPI / Swagger Documentation

We use Springdoc OpenAPI to auto-generate documentation.

- **Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs

### How to test via Swagger

1. Click the green **Authorize** button.
2. Paste a valid JWT Access Token (issued by the Identity Service).
3. Execute endpoints directly from the UI.

## 5) Database & Performance (MongoDB)

To inspect the raw data, open Mongo Express:

- **URL:** http://localhost:8081 (or your configured port)

Navigate to:

```
healthcore_tracking -> foodLogDocument
```

### Performance Note

The collection uses a `@CompoundIndex` on `{ userId: 1, consumedAt: -1 }`.  
This ensures `GET /logs/today` queries execute in **O(log N)** time, bypassing full collection scans even with millions of records.