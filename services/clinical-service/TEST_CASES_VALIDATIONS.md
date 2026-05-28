# Test cases para Clinical Service - validaciones REST

## Base URL local

Las pruebas manuales de este documento asumen acceso directo al servicio:

```text
http://localhost:8087
```

Todos los endpoints funcionales requieren:

```text
Authorization: Bearer <JWT>
Content-Type: application/json
```

## 1. POST /api/v1/clinical/profile - caso exitoso

```json
POST http://localhost:8087/api/v1/clinical/profile

{
  "firstName": "Carlos",
  "paternalLastName": "Gomez",
  "maternalLastName": "Lopez",
  "weightKg": 75.5,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE",
  "goal": "weight-loss",
  "dietType": "omnivore",
  "allergies": ["gluten"],
  "excludedFoods": ["cebolla"]
}
```

**Respuesta esperada:** `200 OK`

## 2. POST /api/v1/clinical/profile - peso menor al minimo

```json
POST http://localhost:8087/api/v1/clinical/profile

{
  "firstName": "Carlos",
  "paternalLastName": "Gomez",
  "weightKg": 25.0,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE",
  "goal": "weight-loss",
  "dietType": "omnivore"
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "weightKg": "Weight must be at least 40.0 kg"
  }
}
```

## 3. POST /api/v1/clinical/profile - altura mayor al maximo

```json
POST http://localhost:8087/api/v1/clinical/profile

{
  "firstName": "Carlos",
  "paternalLastName": "Gomez",
  "weightKg": 75.5,
  "heightCm": 260.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE",
  "goal": "weight-loss",
  "dietType": "omnivore"
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "heightCm": "Height must be at most 250 cm"
  }
}
```

## 4. POST /api/v1/clinical/profile - campo requerido faltante

```json
POST http://localhost:8087/api/v1/clinical/profile

{
  "paternalLastName": "Gomez",
  "weightKg": 75.5,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE",
  "goal": "weight-loss",
  "dietType": "omnivore"
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "firstName": "First name is required"
  }
}
```

## 5. POST /api/v1/clinical/weight - caso exitoso

```json
POST http://localhost:8087/api/v1/clinical/weight

{
  "weightKg": 72.5,
  "date": "2026-05-27"
}
```

**Respuesta esperada:** `200 OK`

```json
{
  "targetCalories": 2300,
  "targetProtein": 140,
  "targetCarbs": 230,
  "targetFat": 60,
  "targetWaterGlasses": 10
}
```

## 6. POST /api/v1/clinical/weight - peso fuera de rango

```json
POST http://localhost:8087/api/v1/clinical/weight

{
  "weightKg": 28.0,
  "date": "2026-05-27"
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "weightKg": "Peso minimo permitido es 40.0 kg"
  }
}
```

## 7. POST /api/v1/clinical/weight - fecha futura

```json
POST http://localhost:8087/api/v1/clinical/weight

{
  "weightKg": 72.5,
  "date": "2099-01-01"
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "date": "La fecha no puede estar en el futuro"
  }
}
```

## 8. PUT /api/v1/clinical/profile/me/photo - storage key faltante

```json
PUT http://localhost:8087/api/v1/clinical/profile/me/photo

{
  "profilePhotoKey": ""
}
```

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "profilePhotoKey": "Profile photo key is required"
  }
}
```

## 9. POST /api/v1/clinical/observations - nota demasiado larga

```json
POST http://localhost:8087/api/v1/clinical/observations

{
  "patientId": "patient-123",
  "note": "aaaa..."
}
```

> Usa una cadena mayor a 500 caracteres en `note`.

**Respuesta esperada:** `400 Bad Request`

```json
{
  "error": "Validation Error",
  "errors": {
    "note": "Observation note must be at most 500 characters long"
  }
}
```

## Notas importantes

- Las validaciones ocurren antes de llegar a la logica de negocio.
- El `GlobalExceptionHandler` responde con estructura uniforme para errores de validacion.
- La identidad del usuario autenticado se toma del JWT; los headers manuales como `X-User-Id` no forman parte del contrato REST real.
