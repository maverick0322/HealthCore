package com.healthcore.notification_service.infrastructure.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.resend")
public record ResendProperties(
        @NotBlank String apiKey,
        @NotBlank String fromEmail,
        @NotBlank String fromName
) {
}
