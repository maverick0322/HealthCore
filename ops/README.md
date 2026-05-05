# HealthCore Operations & Observability

This directory contains the operational infrastructure for the HealthCore microservices ecosystem, including the observability stack, database initialization, and specialized deployment configurations.

## Directory Structure

```text
ops/
├── observability/      # Centralized logging, tracing, and metrics stack
│   ├── grafana/        # Dashboards and data source provisioning
│   ├── loki/           # Log aggregation system
│   ├── prometheus/     # Metrics collection and storage
│   ├── promtail/       # Log shipping from Docker containers
│   └── tempo/          # Distributed tracing storage
├── init-mongo.js       # MongoDB initialization scripts
├── docker-compose.yml  # Base operations services
└── sonarqube-compose.yml # Static code analysis infrastructure
```

## Observability Stack

The HealthCore observability stack follows the **"Three Pillars of Observability"**:

### 1. Metrics (Prometheus)
- **Endpoint**: `http://localhost:9091`
- **Configuration**: Scrapes `/actuator/prometheus` from all Spring Boot services every 15 seconds.
- **Key Metrics**: JVM health, request latency (Micrometer), database connection pools, and custom business metrics.

### 2. Logging (Loki + Promtail)
- **Loki**: `http://localhost:3100`
- **Promtail**: Automatically discovers and streams logs from all Docker containers in the `healthcore` network.
- **Trace correlation**: Logs are formatted in JSON and include `trace_id` and `span_id` for direct linking to traces in Grafana.

### 3. Tracing (Tempo)
- **Endpoint**: `http://localhost:3200`
- **Protocol**: OTLP (OpenTelemetry) over HTTP on port 4318.
- **Visualization**: Traces can be queried in Grafana and explored via the "Explore" view.

## Dashboards (Grafana)
- **URL**: `http://localhost:3000`
- **Default Credentials**: Defined in `.env` (`GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- **Provisioning**: 
    - Data sources (Prometheus, Loki, Tempo) are automatically configured.
    - Standard Spring Boot Micrometer dashboards (e.g., ID 4701) are pre-loaded.

## Operations Commands

### Start Observability Stack
```bash
docker compose up -d loki tempo prometheus grafana promtail
```

### Static Code Analysis (SonarQube)
```bash
docker compose -f ops/sonarqube-compose.yml up -d
```

---
*Last Updated: May 2026*
