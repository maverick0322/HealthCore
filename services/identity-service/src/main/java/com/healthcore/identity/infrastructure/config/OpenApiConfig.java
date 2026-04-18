package com.healthcore.identity.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI identityServiceOpenApi(
            @Value("${app.openapi.title:HealthCore Identity Service API}") String title,
            @Value("${app.openapi.version:1.0.0}") String version,
            @Value("${app.openapi.description:Identity and access management endpoints}") String description,
            @Value("${app.openapi.server-url:http://localhost:8082}") String serverUrl) {

        final String bearerSchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title(title)
                        .version(version)
                        .description(description))
                .addServersItem(new Server().url(serverUrl))
                .addSecurityItem(new SecurityRequirement().addList(bearerSchemeName))
                .components(new Components().addSecuritySchemes(bearerSchemeName,
                        new SecurityScheme()
                                .name(bearerSchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}

