package com.healthcore.tracking.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI trackingOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HealthCore - Tracking Service API")
                        .description("Servicio encargado del registro de ingesta alimenticia y seguimiento de metas.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Erickmel Vázquez")
                                .email("evazquez@healthcore.com")));
    }
}