package com.healthcore.identity.infrastructure.messaging;

import com.healthcore.identity.application.events.PasswordResetRequestedEvent;
import com.healthcore.identity.application.events.UserRegisteredEvent;
import com.healthcore.identity.application.ports.IdentityEventPublisher;
import com.healthcore.identity.infrastructure.config.MessagingProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RabbitIdentityEventPublisher implements IdentityEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties messagingProperties;

    @Override
    public void publishUserRegistered(UserRegisteredEvent event) {
        log.debug("Publishing UserRegisteredEvent for userId={} email={}", event.userId(), event.email());
        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKeys().userRegistered(),
                event
        );
    }

    @Override
    public void publishPasswordResetRequested(PasswordResetRequestedEvent event) {
        log.debug("Publishing PasswordResetRequestedEvent for email={}", event.email());
        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKeys().passwordResetRequested(),
                event
        );
    }
}
