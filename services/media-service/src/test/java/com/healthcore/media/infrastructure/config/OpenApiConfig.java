package com.healthcore.media.infrastructure.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "HealthCore Media Service API",
                version = "1.0",
                description = "Microservicio para la orquestación segura de almacenamiento de archivos médicos utilizando URLs firmadas y Cloudflare R2. Protegido por limitación de tasa (Rate Limiting).",
                contact = @Contact(name = "HealthCore Engineering Team")
        )
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        description = "Ingresa tu token JWT para autenticarte."
)
public class OpenApiConfig {
}