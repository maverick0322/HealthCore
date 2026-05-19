# Stage 1: Build (full JDK to compile gRPC stubs via protoc)
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom first — this layer is cached whenever only source files change
COPY pom.xml .
RUN mvn package -q -Dmaven.test.skip=true --no-transfer-progress 2>/dev/null || true

COPY src ./src
RUN mvn clean package -DskipTests --no-transfer-progress

# Stage 2: Runtime (lean JRE image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

