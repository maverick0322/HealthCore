package com.healthcore.notification_service.infrastructure.messaging;

import com.healthcore.notification_service.infrastructure.config.MessagingProperties;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class DeadLetteringMessageRecovererTest {

    @Test
    void recoverPublishesToDeadLetterExchangeWithHeaders() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        MessagingProperties properties = new MessagingProperties(
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

        DeadLetteringMessageRecoverer recoverer = new DeadLetteringMessageRecoverer(rabbitTemplate, properties);

        MessageProperties messageProperties = new MessageProperties();
        messageProperties.setConsumerQueue("welcome-queue");
        Message message = MessageBuilder.withBody("payload".getBytes(StandardCharsets.UTF_8))
                .andProperties(messageProperties)
                .build();

        recoverer.recover(message, new IllegalStateException("boom"));

        ArgumentCaptor<Message> messageCaptor = ArgumentCaptor.forClass(Message.class);
        verify(rabbitTemplate).send(
                org.mockito.ArgumentMatchers.eq("notification-dlx"),
                org.mockito.ArgumentMatchers.eq("welcome-queue.dlq"),
                messageCaptor.capture()
        );

        Message captured = messageCaptor.getValue();
        assertEquals("boom", captured.getMessageProperties().getHeaders().get("x-exception-message"));
        assertNotNull(captured.getMessageProperties().getHeaders().get("x-exception-class"));
    }
}

