# HealthCore Identity Service - Postman Collection Structure

This guide outlines a complete structure for your Postman tests, covering all `identity-service` endpoints and their possible states. It is designed to help you organize requests into a logical flow.

## Global Variables Setup
Set up the following variables in your Postman environment (`HealthCore Local`):
- `{{baseUrl}}`: `http://localhost:8082` (or `http://localhost:80` if accessing through the API Gateway)
- `{{testEmail}}`: `patient.test@healthcore.com`
- `{{testPassword}}`: `SecureP@ss123`
- `{{accessToken}}`: Automatically populated via test scripts
- `{{refreshToken}}`: Automatically populated via test scripts
- `{{verificationCode}}`: Extracted manually from logs during testing
- `{{resetCode}}`: Extracted manually from logs during testing

---

## 1. Authentication (Local)

### 1.1 Register
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/register`
**Body:**
```json
{
  "email": "{{testEmail}}",
  "password": "{{testPassword}}",
  "role": "PATIENT"
}
```
**Tests to Create:**
- **[Success]** Valid registration (Expect 201 Created). *Check logs for the verification code!*
- **[Error]** Duplicate email (Expect 409 Conflict).
- **[Error]** Invalid email format (Expect 400 Bad Request).
- **[Error]** Weak password (Expect 400 Bad Request - if validation exists).

### 1.2 Verify Email
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/verify-code`
**Body:**
```json
{
  "email": "{{testEmail}}",
  "code": "{{verificationCode}}"
}
```
**Tests to Create:**
- **[Success]** Valid code (Expect 200 OK).
- **[Error]** Invalid code (Expect 401 Unauthorized).
- **[Error]** Expired code (Expect 401 Unauthorized).

### 1.3 Login
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/login`
**Body:**
```json
{
  "email": "{{testEmail}}",
  "password": "{{testPassword}}"
}
```
**Post-response Script (for Success):**
```javascript
if (pm.response.code === 200) {
    pm.environment.set("accessToken", pm.response.json().accessToken);
    pm.environment.set("refreshToken", pm.response.json().refreshToken);
}
```
**Tests to Create:**
- **[Success]** Valid credentials (Expect 200 OK, saves tokens).
- **[Error]** Invalid password (Expect 401 Unauthorized).
- **[Error]** Non-existent user (Expect 401 Unauthorized).
- **[Error]** Too many failed attempts (Expect 429 Too Many Requests) -> *trigger this by sending 5+ invalid password requests in a row.*

### 1.4 Get Current User (Me)
**Endpoint:** `GET {{baseUrl}}/api/v1/auth/me`
**Headers:** `Authorization: Bearer {{accessToken}}`
**Tests to Create:**
- **[Success]** Valid token (Expect 200 OK, verify email and role match).
- **[Error]** Missing token (Expect 401 Unauthorized).
- **[Error]** Invalid/Expired token (Expect 401 Unauthorized).

---

## 2. Token Lifecycle Management

### 2.1 Refresh Token
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/refresh`
**Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```
**Post-response Script (for Success):**
```javascript
if (pm.response.code === 200) {
    pm.environment.set("accessToken", pm.response.json().accessToken);
    pm.environment.set("refreshToken", pm.response.json().refreshToken);
}
```
**Tests to Create:**
- **[Success]** Valid refresh token (Expect 200 OK, saves new tokens).
- **[Error]** Invalid refresh token (Expect 401 Unauthorized).
- **[Error]** Re-using revoked refresh token (Expect 401 Unauthorized).

### 2.2 Logout
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/logout`
**Headers:** `Authorization: Bearer {{accessToken}}`
**Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```
**Tests to Create:**
- **[Success]** Valid logout (Expect 200 OK, token is revoked).
- **[Error]** Invalid refresh token (Expect 401 Unauthorized).

---

## 3. Account Recovery

### 3.1 Request Password Reset
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/password-reset/request`
**Body:**
```json
{
  "email": "{{testEmail}}"
}
```
**Tests to Create:**
- **[Success]** Valid request (Expect 200 OK). *Check logs for the reset code!*
- **[Success]** Non-existent email (Expect 200 OK - ensures we don't leak user existence).

### 3.2 Confirm Password Reset
**Endpoint:** `POST {{baseUrl}}/api/v1/auth/password-reset/confirm`
**Body:**
```json
{
  "email": "{{testEmail}}",
  "code": "{{resetCode}}",
  "newPassword": "NewSecureP@ss123!"
}
```
**Tests to Create:**
- **[Success]** Valid code and new password (Expect 200 OK).
- **[Error]** Invalid code (Expect 401 Unauthorized).

---

## 4. Admin Operations

### 4.1 Create User (Admin Only)
**Endpoint:** `POST {{baseUrl}}/api/v1/admin/users`
**Headers:** `Authorization: Bearer {{adminAccessToken}}` *(Generate this by logging in with an Admin account)*
**Body:**
```json
{
  "email": "nutritionist@healthcore.com",
  "password": "{{testPassword}}",
  "role": "NUTRITIONIST"
}
```
**Tests to Create:**
- **[Success]** Admin creating Nutritionist (Expect 201 Created).
- **[Error]** Patient trying to create a user (Expect 403 Forbidden).
- **[Error]** Duplicate email (Expect 409 Conflict).
