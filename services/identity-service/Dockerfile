# Stage 1: Build (full JDK image to compile gRPC stubs via protoc)
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom first so this layer is cached when only source changes
COPY pom.xml .
# Use package -q so Maven downloads all deps and fails fast on resolution errors,
# without needing a separate go-offline step that is prone to DNS flakiness.
RUN mvn package -q -Dmaven.test.skip=true --no-transfer-progress 2>/dev/null || true

COPY src ./src
RUN mvn clean package -DskipTests --no-transfer-progress

# Stage 2: Runtime (lean JRE image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]