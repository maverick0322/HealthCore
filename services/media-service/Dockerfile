# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Optimizacion de caché: Copiamos solo el pom.xml primero para descargar dependencias
COPY pom.xml .
RUN mvn package -q -Dmaven.test.skip=true --no-transfer-progress 2>/dev/null || true

# Copiamos el código fuente y compilamos
COPY src ./src
RUN mvn clean package -DskipTests --no-transfer-progress

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Seguridad: Ejecutar como usuario sin privilegios de root
RUN addgroup -S healthcore && adduser -S healthcore -G healthcore
USER healthcore:healthcore

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8088

ENTRYPOINT ["java", "-jar", "app.jar"]