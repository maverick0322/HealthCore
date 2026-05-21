# ==========================================
# Stage 1: Build the application
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy the Maven wrapper and configuration files
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Copy the source code
COPY src src

# Ensure the Maven wrapper script is executable
RUN chmod +x ./mvnw

# Build the application, skipping tests to accelerate the container build time
RUN ./mvnw clean package -DskipTests

# ==========================================
# Stage 2: Run the application
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# SECURITY: Create a non-root user to run the application.
# Prevents privilege escalation attacks if the container is compromised.
RUN addgroup -S healthcore && adduser -S healthcore -G healthcore
USER healthcore:healthcore

# Copy ONLY the built artifact from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8088

# Define the entry point
ENTRYPOINT ["java", "-jar", "app.jar"]