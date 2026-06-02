# Grafana - Metricas de negocio

Este documento explica como visualizar en Grafana las metricas de negocio expuestas por los servicios.

## Prerrequisitos
- Observabilidad levantada (Prometheus + Grafana).
- Servicios corriendo con Actuator y Micrometer.
- Prometheus configurado para scrapear `/actuator/prometheus`.

## Acceso a Grafana
1. Abrir `http://localhost:3000`.
2. Iniciar sesion con las credenciales definidas en `.env`.
3. Verificar que el data source Prometheus exista y este OK.

## Metricas disponibles
### Usuarios activos (ultimo dia)
- Metrica: `identity.active_users.last_day`
- Tipo: gauge
- Tags: `window=1d`
- Fuente: identity-service

Consulta PromQL recomendada:
```
identity_active_users_last_day
```

> Nota: Micrometer exporta los puntos en Prometheus con guiones bajos. Por eso `identity.active_users.last_day` se consulta como `identity_active_users_last_day`.

### Reservas de citas
- Metrica en Java: `agenda.appointments.created` -> En Prometheus: `agenda_appointments_total`
- Metrica en Java: `agenda.appointments.create.failed` -> En Prometheus: `agenda_appointments_create_failed_total`
- Metrica en Java: `agenda.appointments.confirmed` -> En Prometheus: `agenda_appointments_confirmed_total`
- Tipo: counter
- Fuente: agenda-service

Consultas PromQL recomendadas (tasa por minuto):
```
rate(agenda_appointments_total[1m])
rate(agenda_appointments_create_failed_total[1m])
rate(agenda_appointments_confirmed_total[1m])
```


## Crear paneles en Grafana
1. En Grafana, ir a **Dashboards** -> **New** -> **New dashboard**.
2. Agregar un panel y seleccionar el data source Prometheus.
3. Usar una de las consultas PromQL de arriba.
4. Ajustar la unidad:
   - Usuarios activos: `none`.
   - Contadores/tasa: `req/s` o `ops/s`.
5. Guardar el dashboard con un nombre como "Business Metrics".

## Ideas de visualizacion
- Usuarios activos: panel tipo **Stat** con el valor actual.
- Reservas creadas vs fallidas: panel **Time series** con 2 consultas.
- Confirmaciones: panel **Time series** separado.

## Solucion de problemas
- Si no hay datos, validar que Prometheus scrapee los endpoints y que los servicios esten arriba.
- En Prometheus, probar la query directamente para confirmar que la metrica existe.
- Verificar el prefijo de nombre: Micrometer convierte puntos en guiones bajos.
