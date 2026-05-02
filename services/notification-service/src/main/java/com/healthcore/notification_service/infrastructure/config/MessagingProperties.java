package com.healthcore.notification_service.infrastructure.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.messaging")
public record MessagingProperties(
        @NotBlank String exchange,
        @NotBlank String agendaExchange,
        @NotBlank String deadLetterExchange,
        @NotBlank String deadLetterQueueSuffix,
        Queues queues,
        RoutingKeys routingKeys
) {

    public record Queues(
            @NotBlank String welcomeEmail,
            @NotBlank String passwordResetEmail,
            @NotBlank String appointmentConfirmedEmail,
            @NotBlank String appointmentCancelledEmail,
            @NotBlank String appointmentReminderEmail
    ) {
    }

    public record RoutingKeys(
            @NotBlank String userRegistered,
            @NotBlank String passwordResetRequested,
            @NotBlank String appointmentConfirmed,
            @NotBlank String appointmentCancelled,
            @NotBlank String appointmentReminder
    ) {
    }
}
