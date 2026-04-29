package com.healthcore.agenda_service.infrastructure.messaging;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.messaging")
public record MessagingProperties(
        @NotBlank String exchange,
        RoutingKeys routingKeys
) {

    public record RoutingKeys(
            @NotBlank String appointmentConfirmed,
            @NotBlank String appointmentCancelled,
            @NotBlank String appointmentReminder
    ) {
    }
}
