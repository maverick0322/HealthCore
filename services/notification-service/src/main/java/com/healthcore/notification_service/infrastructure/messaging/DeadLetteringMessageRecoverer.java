package com.healthcore.notification_service.infrastructure.messaging;

import com.healthcore.notification_service.infrastructure.config.MessagingProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;

import java.util.Optional;

@Slf4j
public class DeadLetteringMessageRecoverer implements MessageRecoverer {

    private static final String HEADER_EXCEPTION_MESSAGE = "x-exception-message";
    private static final String HEADER_EXCEPTION_CLASS = "x-exception-class";

    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties messagingProperties;

    public DeadLetteringMessageRecoverer(RabbitTemplate rabbitTemplate, MessagingProperties messagingProperties) {
        this.rabbitTemplate = rabbitTemplate;
        this.messagingProperties = messagingProperties;
    }

    @Override
    public void recover(Message message, Throwable cause) {
        MessageProperties properties = message.getMessageProperties();
        String consumerQueue = properties.getConsumerQueue();
        String routingKey = buildDeadLetterRoutingKey(consumerQueue);

        properties.getHeaders().put(HEADER_EXCEPTION_MESSAGE, Optional.ofNullable(cause.getMessage()).orElse(""));
        properties.getHeaders().put(HEADER_EXCEPTION_CLASS, cause.getClass().getName());

        log.warn(
                "Publishing failed message to DLQ. queue={} routingKey={} messageId={} correlationId={} cause={}",
                consumerQueue,
                routingKey,
                properties.getMessageId(),
                properties.getCorrelationId(),
                cause.getClass().getSimpleName()
        );

        rabbitTemplate.send(messagingProperties.deadLetterExchange(), routingKey, message);
    }

    private String buildDeadLetterRoutingKey(String consumerQueue) {
        String base = consumerQueue == null ? "unknown" : consumerQueue;
        return base + messagingProperties.deadLetterQueueSuffix();
    }
}

