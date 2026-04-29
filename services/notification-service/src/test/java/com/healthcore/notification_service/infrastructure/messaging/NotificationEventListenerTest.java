package com.healthcore.notification_service.infrastructure.messaging;

import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private SendWelcomeEmailUseCase sendWelcomeEmailUseCase;

    @Mock
    private SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase;

    @Test
    void handleUserRegisteredEventDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(sendWelcomeEmailUseCase, sendPasswordResetEmailUseCase);
        UserRegisteredEvent event = new UserRegisteredEvent(
            "user-123",
            "user@healthcore.com",
            "PATIENT",
            "2026-04-28T10:00:00Z",
            true,
            "123456",
            "2026-04-28T10:15:00Z"
        );

        listener.handleUserRegisteredEvent(event);

        verify(sendWelcomeEmailUseCase).send(event);
    }

    @Test
    void handlePasswordResetRequestedEventDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(sendWelcomeEmailUseCase, sendPasswordResetEmailUseCase);
        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T10:15:00Z");

        listener.handlePasswordResetRequestedEvent(event);

        verify(sendPasswordResetEmailUseCase).send(event);
    }
}
