# Identity Service - Frontend Integration Guide

This guide summarizes the minimum setup and request flow to integrate a SPA frontend with the identity service in development.

## 1) Environment variables

Set these values in your compose `.env` file.

```dotenv
JWT_SECRET=REPLACE_WITH_A_STRONG_SECRET_32B_OR_MORE
JWT_ACCESS_TOKEN_VALIDITY_MS=300000
JWT_REFRESH_TOKEN_VALIDITY_MS=86400000

# Optional manual DB seed for local role testing
APP_MANUALDB_SEED_ENABLED=false
APP_MANUALDB_SEED_PATIENT_EMAIL=patient.seed@healthcore.com
APP_MANUALDB_SEED_PATIENT_PASSWORD=REPLACE_WITH_LOCAL_PATIENT_PASSWORD
APP_MANUALDB_SEED_NUTRITIONIST_EMAIL=nutritionist.seed@healthcore.com
APP_MANUALDB_SEED_NUTRITIONIST_PASSWORD=REPLACE_WITH_LOCAL_NUTRITIONIST_PASSWORD
APP_MANUALDB_SEED_ADMIN_PASSWORD=REPLACE_WITH_LOCAL_ADMIN_PASSWORD

SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_SCOPE=openid,profile,email
SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_AUTH0_ISSUER_URI=https://YOUR_TENANT.us.auth0.com/

APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
APP_OPENAPI_TITLE=HealthCore Identity Service API
APP_OPENAPI_VERSION=1.0.0
APP_OPENAPI_DESCRIPTION=Identity and access management endpoints
APP_OPENAPI_SERVER_URL=http://localhost:8082

# Security hardening
APP_SECURITY_RATE_LIMIT_ENABLED=true
APP_SECURITY_RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE=30
APP_SECURITY_BRUTE_FORCE_ENABLED=true
APP_SECURITY_BRUTE_FORCE_MAX_FAILED_ATTEMPTS=5
APP_SECURITY_BRUTE_FORCE_LOCK_MINUTES=15
```

## 2) Auth0 app configuration

Use an Auth0 application of type **Regular Web Application**.

Configure:

- Allowed Callback URLs: `http://localhost:8082/login/oauth2/code/auth0`
- Allowed Logout URLs: `http://localhost:8082`
- Allowed Web Origins: `http://localhost:8082`

## 3) Start services

```powershell
~ Path to HealthCore root directory
Set-Location "~\HealthCore"
docker compose up -d --build mongodb identity-service
docker compose logs -f identity-service
```

When OAuth2 env vars are correct, logs should include:

- `OAuth2 login integration enabled for configured providers`

## 4) OAuth login from frontend/browser

Start flow by opening:

- `http://localhost:8082/oauth2/authorization/auth0`

After successful login, backend returns JSON:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "accessTokenExpiresInMs": 300000,
  "refreshTokenExpiresInMs": 86400000
}
```

### Auth Providers & Collision Scenarios

HealthCore supports multiple authentication options (e.g. `LOCAL` password login, or social logins via OAuth2 providers like `GOOGLE` and `AUTH0`). The following rules resolve conflicts when the same email is involved in multiple auth flows:

#### Scenario A: Login via Google/OAuth2 but not yet registered
If the email is not registered in HealthCore at all:
- The system automatically registers (provisions) the user with `provider = GOOGLE` (or `AUTH0`), role = `PATIENT`, and sets `emailVerified = true`.
- They are logged in immediately and issued JWT tokens.

#### Scenario B: Local Registration with an email already registered via Google/OAuth2
If a user tries to register locally using `POST /api/v1/auth/register` with an email that has already been registered through a social provider:
- The system checks if the email exists.
- The registration is rejected with `409 Conflict` containing the message: `"Email is already registered in HealthCore"`.

#### Scenario C: Login via Google/OAuth2 with an email already registered locally (or with another provider)
If a user authenticates via a social provider but their email is already registered under `LOCAL` (or a different provider):
- The system blocks the authentication and throws `OAuth2ProviderConflictException`.
- The `OAuth2LoginSuccessHandler` catches this and redirects the browser back to the frontend redirect callback URL with query parameters containing conflict details:
  - `error=OAUTH2_PROVIDER_CONFLICT`
  - `message=Email is already registered with a different authentication provider`
  - `existingProvider=LOCAL` (or the actual current provider, e.g., `AUTH0`)
  - `requestedProvider=GOOGLE` (or the requested provider)

***

## 5) REST endpoints for frontend

Auth base URL: `http://localhost:8082/api/v1/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /verify-code`
- `POST /password-reset/request`
- `POST /password-reset/confirm`
- `GET /me`
- `POST /logout`

Role-scoped base URL: `http://localhost:8082/api/v1`

- `GET /patients/home` (PATIENT only)
- `GET /nutritionists/home` (NUTRITIONIST only)
- `GET /admin/home` (ADMIN only)
- `POST /admin/users` (ADMIN only)

### Registration payload (role-aware)

`POST /api/v1/auth/register`

```json
{
  "email": "nutritionist1@healthcore.com",
  "password": "StrongPass123!",
  "role": "NUTRITIONIST"
}
```

`role` is optional. If omitted, backend defaults to `PATIENT`. Self-registration as `ADMIN` is blocked.

Password policy:

- 8-72 characters
- Must include upper, lower, number, and symbol

### Current user endpoint (`/me`)

`GET /api/v1/auth/me` now uses the authenticated principal already loaded by JWT security filter. Frontend only needs a valid bearer access token; the controller no longer parses token claims directly.

### Admin-managed local user provisioning

`POST /api/v1/admin/users`

```json
{
  "email": "new.admin@healthcore.com",
  "password": "StrongPass123!",
  "role": "ADMIN"
}
```

This endpoint is restricted to users with `ADMIN` role and supports managed provisioning of `PATIENT`, `NUTRITIONIST`, and `ADMIN` local accounts.

### Rate limiting and brute-force protection

Authentication and recovery endpoints are protected with per-IP rate limiting. Login also has brute-force protection by login identifier, temporarily blocking repeated failed attempts and returning `429 TOO_MANY_REQUESTS`.

## 6) OpenAPI / Swagger

- OpenAPI JSON: `http://localhost:8082/api-docs`
- OpenAPI JSON (compat): `http://localhost:8082/v3/api-docs`
- Swagger UI: `http://localhost:8082/docs`

These documentation routes are public and should not redirect to Auth0 login.

If the service is exposed behind an API Gateway, set `APP_OPENAPI_SERVER_URL` to the gateway base URL so frontend teams can call documented routes directly from Swagger.

## 7) Token refresh example

`POST /api/v1/auth/refresh`

```json
{
  "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
}
```

Expected response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "accessTokenExpiresInMs": 300000,
  "refreshTokenExpiresInMs": 86400000
}
```
