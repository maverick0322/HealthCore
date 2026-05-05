# 📋 Test Cases para Clinical Service - Validaciones

## 1. ✅ POST /api/v1/clinical/profile - Caso Exitoso

```json
POST http://localhost:8080/api/v1/clinical/profile
X-User-Id: user123
Content-Type: application/json

{
  "weightKg": 75.5,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 200 OK
```

---

## 2. ❌ POST /api/v1/clinical/profile - Peso muy bajo (< 30 kg)

```json
POST http://localhost:8080/api/v1/clinical/profile
X-User-Id: user123
Content-Type: application/json

{
  "weightKg": 25.0,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 400 Bad Request
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Validation Error",
  "message": "Los datos proporcionados no cumplen con los requisitos de validación",
  "errors": {
    "weightKg": "Peso mínimo permitido es 30.0 kg"
  }
}
```

---

## 3. ❌ POST /api/v1/clinical/profile - Peso muy alto (> 300 kg)

```json
{
  "weightKg": 350.0,
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "weightKg": "Peso máximo permitido es 300.0 kg"
  }
}
```

---

## 4. ❌ POST /api/v1/clinical/profile - Altura muy baja (< 50 cm)

```json
{
  "weightKg": 75.5,
  "heightCm": 45.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "heightCm": "Altura mínima permitida es 50.0 cm"
  }
}
```

---

## 5. ❌ POST /api/v1/clinical/profile - Altura muy alta (> 250 cm)

```json
{
  "weightKg": 75.5,
  "heightCm": 260.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "heightCm": "Altura máxima permitida es 250.0 cm"
  }
}
```

---

## 6. ❌ POST /api/v1/clinical/profile - Campo requerido faltante

```json
{
  "heightCm": 175.0,
  "birthDate": "1995-01-15",
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE"
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "weightKg": "Peso es requerido"
  }
}
```

---

## 7. ✅ POST /api/v1/clinical/weight - Caso Exitoso

```json
POST http://localhost:8080/api/v1/clinical/weight
X-User-Id: user123
X-User-Id: user123
Content-Type: application/json

{
  "weightKg": 72.5
}

// Respuesta esperada: 200 OK
{
  "targetCalories": 2300,
  "targetProtein": 140,
  "targetCarbs": 230,
  "targetFat": 60
}
```

---

## 8. ❌ POST /api/v1/clinical/weight - Peso fuera de rango

```json
{
  "weightKg": 28.0
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "weightKg": "Peso mínimo permitido es 30.0 kg"
  }
}
```

---

## 9. ❌ POST /api/v1/clinical/weight - Campo faltante

```json
{
  // weightKg faltante
}

// Respuesta esperada: 400 Bad Request
{
  "errors": {
    "weightKg": "Peso es requerido"
  }
}
```

---

## Notas Importantes

- Todas las validaciones ocurren **antes** de llegar a la lógica de negocio
- Los mensajes de error son claros y en español
- Los códigos HTTP son estándar (400 para validación, 500 para errores)
- El handler global captura excepciones de validación automáticamente
