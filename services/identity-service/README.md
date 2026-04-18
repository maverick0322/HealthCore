# Identity Service - Frontend Integration Guide

This guide summarizes the minimum setup and request flow to integrate a SPA frontend with the identity service in development.

## 1) Environment variables

Set these values in your compose `.env` file.

```dotenv
JWT_SECRET=REPLACE_WITH_A_STRONG_SECRET_32B_OR_MORE
JWT_ACCESS_TOKEN_VALIDITY_MS=300000
JWT_REFRESH_TOKEN_VALIDITY_MS=86400000

SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_SCOPE=openid,profile,email
SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_AUTH0_ISSUER_URI=https://YOUR_TENANT.us.auth0.com/

APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
APP_OPENAPI_TITLE=HealthCore Identity Service API
APP_OPENAPI_VERSION=1.0.0
APP_OPENAPI_DESCRIPTION=Identity and access management endpoints
APP_OPENAPI_SERVER_URL=http://localhost:8082
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

## 5) REST endpoints for frontend

Base URL: `http://localhost:8082/api/v1/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /verify-code`
- `POST /password-reset/request`
- `POST /password-reset/confirm`
- `GET /me`
- `POST /logout`

## 6) OpenAPI / Swagger

- OpenAPI JSON: `http://localhost:8082/api-docs`
- Swagger UI: `http://localhost:8082/docs`

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

