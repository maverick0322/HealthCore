package com.healthcore.notification_service.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.notification_service.infrastructure.config.MessagingProperties;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RabbitMessagingConfigTest {

    @Test
    void queuesIncludeDeadLetterConfiguration() {
        RabbitMessagingConfig config = new RabbitMessagingConfig();
        MessagingProperties properties = sampleProperties();

        Queue queue = config.welcomeEmailQueue(properties);

        assertEquals("notification-dlx", queue.getArguments().get("x-dead-letter-exchange"));
        assertEquals("welcome-queue.dlq", queue.getArguments().get("x-dead-letter-routing-key"));
    }

    @Test
    void bindingsUseExpectedRoutingKeys() {
        RabbitMessagingConfig config = new RabbitMessagingConfig();
        MessagingProperties properties = sampleProperties();

        TopicExchange exchange = new TopicExchange(properties.exchange());
        Queue queue = new Queue(properties.queues().welcomeEmail());
        Binding binding = config.welcomeEmailBinding(exchange, queue, properties);

        assertEquals("identity.user.registered", binding.getRoutingKey());
        assertEquals("identity-ex", binding.getExchange());
    }

    @Test
    void objectMapperSerializesInstantsAsIsoStrings() throws Exception {
        RabbitMessagingConfig config = new RabbitMessagingConfig();

        ObjectMapper mapper = config.objectMapper();
        String json = mapper.writeValueAsString(Instant.parse("2026-04-28T10:00:00Z"));

        assertEquals("\"2026-04-28T10:00:00Z\"", json);
    }

    @Test
    void dlqBindingsUseDeadLetterExchange() {
        RabbitMessagingConfig config = new RabbitMessagingConfig();
        MessagingProperties properties = sampleProperties();

        TopicExchange dlx = new TopicExchange(properties.deadLetterExchange());
        Queue dlq = config.welcomeEmailDlqQueue(properties);
        Binding binding = config.welcomeEmailDlqBinding(dlx, dlq, properties);

        assertEquals("notification-dlx", binding.getExchange());
        assertTrue(binding.getRoutingKey().endsWith(".dlq"));
    }

    private MessagingProperties sampleProperties() {
        return new MessagingProperties(
                "identity-ex",
                "agenda-ex",
                "notification-dlx",
                ".dlq",
                new MessagingProperties.Queues(
                        "welcome-queue",
                        "password-queue",
                        "appointment-confirmed",
                        "appointment-cancelled",
                        "appointment-reminder"
                ),
                new MessagingProperties.RoutingKeys(
                        "identity.user.registered",
                        "identity.password.reset.requested",
                        "agenda.appointment.confirmed",
                        "agenda.appointment.cancelled",
                        "agenda.appointment.reminder"
                )
        );
    }
}

