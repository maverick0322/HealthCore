# Contexto: Reportes del Nutriólogo

## Propósito
La sección `Reportes y gestión operativa` ofrece una vista consolidada para el nutriólogo usando únicamente datos de:

* `clinical-service`
* `agenda-service`

Queda fuera de alcance cualquier cruce con `tracking-service`, adherencia del plan, macros o comidas.

## Clinical Service
El frontend consume un endpoint dedicado para reportes de peso:

* `GET /api/v1/clinical/nutritionist/reports/weight-progress?from=YYYY-MM-DD&to=YYYY-MM-DD`

Respuesta:

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

Reglas:

* El rango es inclusivo por fecha.
* Solo se consideran registros de `WeightRecord` dentro del período solicitado.
* Si un paciente no tiene registros en el período, la fila sigue visible con valores nulos y `hasRecordsInRange=false`.
* `PatientProfileResponse` no se modifica para este caso; el reporte usa un contrato específico.

## Agenda Service
La pantalla reutiliza:

* `GET /api/v1/agenda/nutritionist/appointments?from=<ISO>&to=<ISO>`

Interpretación en frontend:

* Solo se consideran citas `ATTENDED` y `CANCELLED` para la visualización operativa.
* `PENDING` y `CONFIRMED` no participan en la barra segmentada del reporte.
* El KPI principal de agenda usa únicamente el conteo de `ATTENDED`.

## Filtros del reporte
La pantalla trabaja con períodos por mes calendario hasta hoy:

* `1 mes`
* `3 meses`
* `6 meses`
* `12 meses`

Ejemplo:

* `3 meses` = desde el primer día del mes actual menos dos meses hasta hoy.

## Exportación
La exportación PDF se resuelve en frontend usando el estado actual visible de la pantalla.

Incluye:

* título y fecha de generación
* filtro activo
* KPIs
* resumen de citas
* tabla clínica de control de peso

No existe generación de PDF en backend para esta versión.
