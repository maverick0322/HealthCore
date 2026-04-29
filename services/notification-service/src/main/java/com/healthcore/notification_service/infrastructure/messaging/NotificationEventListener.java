package com.healthcore.notification_service.infrastructure.messaging;

import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationEventListener {

    private final SendWelcomeEmailUseCase sendWelcomeEmailUseCase;
    private final SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase;

    public NotificationEventListener(
            SendWelcomeEmailUseCase sendWelcomeEmailUseCase,
            SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase
    ) {
        this.sendWelcomeEmailUseCase = sendWelcomeEmailUseCase;
        this.sendPasswordResetEmailUseCase = sendPasswordResetEmailUseCase;
    }

    @RabbitListener(queues = "${app.messaging.queues.welcome-email}")
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        try {
            sendWelcomeEmailUseCase.send(event);
        } catch (RuntimeException ex) {
            log.warn("Failed to process welcome email event for userId={} email={}", event.userId(), event.email(), ex);
        }
    }

    @RabbitListener(queues = "${app.messaging.queues.password-reset-email}")
    public void handlePasswordResetRequestedEvent(PasswordResetRequestedEvent event) {
        try {
            sendPasswordResetEmailUseCase.send(event);
        } catch (RuntimeException ex) {
            log.warn("Failed to process password reset email event for email={}", event.email(), ex);
        }
    }
}