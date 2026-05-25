# Contexto: Reportes del Nutriólogo

## 1. Propósito
La sección `Reportes y gestión operativa` ofrece una vista consolidada para el nutriólogo usando únicamente datos reales de:

* `clinical-service`
* `agenda-service`

Queda explícitamente fuera de alcance:

* `tracking-service`
* adherencia al plan
* comidas, macros consumidos o lógica de seguimiento diario

Esta pantalla es operativa, no clínica detallada como el expediente individual del paciente.

## 2. Fuente clínica
El frontend consume un endpoint dedicado para reportes de peso:

* `GET /api/v1/clinical/nutritionist/reports/weight-progress?from=YYYY-MM-DD&to=YYYY-MM-DD`

### Respuesta
* `activePatients`
* `patientsWithoutWeightInRange`
* `rows`

Cada fila incluye:

* `patientId`
* `fullName`
* `latestRecordDateInRange`
* `startWeightKg`
* `currentWeightKg`
* `netChangeKg`
* `hasRecordsInRange`

### Reglas del reporte de peso
* El rango es inclusivo por fecha.
* Solo se consideran registros `WeightRecord` dentro del período solicitado.
* Si un paciente no tiene registros en el período, la fila sigue visible con valores nulos y `hasRecordsInRange=false`.
* El contrato es específico para reportes; no modifica `PatientProfileResponse`.

## 3. Fuente de agenda
La pantalla reutiliza:

* `GET /api/v1/agenda/nutritionist/reports/appointments?from=<ISO>&to=<ISO>`

### Interpretación en frontend
* Solo se consideran citas `ATTENDED` y `CANCELLED` para la visualización operativa principal.
* `PENDING` y `CONFIRMED` pueden venir en la respuesta, pero no participan en la barra principal ni en el resumen ejecutivo.
* El KPI principal de agenda usa únicamente el conteo de `ATTENDED`.

## 4. Filtros del reporte
La pantalla trabaja con períodos por mes calendario hasta hoy:

* `1 mes`
* `3 meses`
* `6 meses`
* `12 meses`

Ejemplo:

* `3 meses` = desde el primer día del mes actual menos dos meses hasta hoy

La leyenda visible debe dejar esto claro al usuario con un texto tipo:

* `Mostrando datos acumulados del ... al ...`

Esto diferencia esta pantalla del historial del paciente, donde se usan ventanas móviles hacia atrás.

## 5. Qué cambia con el filtro activo
El filtro activo debe afectar:

* KPIs visibles
* resumen de citas
* barra operativa de agenda
* tabla clínica de control de peso
* exportación PDF

Si un filtro no cambia el resultado visible, eso significa que los datos disponibles para ese nutriólogo siguen cayendo dentro de todos esos rangos, no necesariamente que el filtro esté roto.

## 6. Exportación PDF
La exportación PDF se resuelve en frontend con un documento estructurado, no como captura del DOM.

Incluye:

* título
* fecha de generación
* rango activo
* ventana activa del reporte
* KPIs
* resumen de citas
* tabla clínica de control de peso

No existe generación de PDF en backend para esta versión.

## 7. Seed local para validación
Para validar esta pantalla con datos reproducibles se agregó un flujo de seed local:

* Script: `scripts/seed-nutritionist-reports.mjs`
* Alias: `npm run seed:reports` desde `apps/health-core`

El script:

* registra o reutiliza `testnutri10@gmail.com`
* crea pacientes `testpac<number>@gmail.com`
* completa perfiles clínicos mínimos
* vincula pacientes con el nutriólogo
* registra pesos de prueba distribuidos por rango
* genera slots y reserva citas por API real
* cancela parte de las citas

## 8. Utilidad dev en agenda
Como el flujo normal de agenda no permite construir fácilmente ciertos estados históricos para reportes, se agregó una utilidad local/test en `agenda-service` para preparar escenarios reproducibles del seed.

Reglas:

* es solo para entorno local/dev
* no forma parte del contrato productivo
* no debe usarse como dependencia funcional de la pantalla fuera del seed

## 9. Contrato esperado con frontend
La pantalla de reportes no depende de tiempo real.

El comportamiento esperado es:

* cargar datos por REST cuando entra a la pantalla
* recalcular todo cuando cambia el filtro
* exportar exactamente lo que representa el estado activo

No existe promesa de sincronización instantánea entre sesiones abiertas sin una capa adicional de realtime.

## 10. Mantenimiento
Si cambia alguno de estos elementos, este documento debe actualizarse:

* contrato del endpoint `/nutritionist/reports/weight-progress`
* lógica de interpretación de estados de cita
* filtros de calendario del reporte
* estructura del PDF
* seed local o utilidades dev asociadas a la validación del reporte
