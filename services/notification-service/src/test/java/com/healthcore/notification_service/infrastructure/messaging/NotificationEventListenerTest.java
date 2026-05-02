package com.healthcore.notification_service.infrastructure.messaging;

import com.healthcore.notification_service.application.usecase.SendAppointmentCancelledEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentConfirmedEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentReminderEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.domain.events.AppointmentCancelledEvent;
import com.healthcore.notification_service.domain.events.AppointmentConfirmedEvent;
import com.healthcore.notification_service.domain.events.AppointmentReminderEvent;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.amqp.rabbit.annotation.RabbitListener;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private SendWelcomeEmailUseCase sendWelcomeEmailUseCase;

    @Mock
    private SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase;

    @Mock
    private SendAppointmentConfirmedEmailUseCase sendAppointmentConfirmedEmailUseCase;

    @Mock
    private SendAppointmentCancelledEmailUseCase sendAppointmentCancelledEmailUseCase;

    @Mock
    private SendAppointmentReminderEmailUseCase sendAppointmentReminderEmailUseCase;

    @Test
    void handleUserRegisteredEventDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
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
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T10:15:00Z");

        listener.handlePasswordResetRequestedEvent(event);

        verify(sendPasswordResetEmailUseCase).send(event);
    }

    @Test
    void handleAppointmentConfirmedDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
        AppointmentConfirmedEvent event = new AppointmentConfirmedEvent(
            "appt-1",
            "patient-1",
            "nutri-1",
            "2026-04-30T10:00:00Z",
            "2026-04-30T10:30:00Z"
        );

        listener.handleAppointmentConfirmedEvent(event);

        verify(sendAppointmentConfirmedEmailUseCase).send(event);
    }

    @Test
    void handleAppointmentCancelledDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
        AppointmentCancelledEvent event = new AppointmentCancelledEvent(
            "appt-2",
            "patient-2",
            "nutri-2",
            "2026-04-30T11:00:00Z",
            "2026-04-30T11:30:00Z"
        );

        listener.handleAppointmentCancelledEvent(event);

        verify(sendAppointmentCancelledEmailUseCase).send(event);
    }

    @Test
    void handleAppointmentReminderDelegatesToUseCase() {
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
        AppointmentReminderEvent event = new AppointmentReminderEvent(
            "appt-3",
            "patient-3",
            "nutri-3",
            "2026-04-30T12:00:00Z",
            "2026-04-30T12:30:00Z"
        );

        listener.handleAppointmentReminderEvent(event);

        verify(sendAppointmentReminderEmailUseCase).send(event);
    }

    @Test
    void handleUserRegisteredEventPropagatesException() {
        NotificationEventListener listener = new NotificationEventListener(
            sendWelcomeEmailUseCase,
            sendPasswordResetEmailUseCase,
            sendAppointmentConfirmedEmailUseCase,
            sendAppointmentCancelledEmailUseCase,
            sendAppointmentReminderEmailUseCase
        );
        UserRegisteredEvent event = new UserRegisteredEvent(
            "user-999",
            "user@healthcore.com",
            "PATIENT",
            "2026-04-28T10:00:00Z",
            true,
            "123456",
            "2026-04-28T10:15:00Z"
        );

        doThrow(new IllegalStateException("boom")).when(sendWelcomeEmailUseCase).send(event);

        Assertions.assertThrows(IllegalStateException.class, () -> listener.handleUserRegisteredEvent(event));
    }

    @ParameterizedTest
    @CsvSource({
            "handleUserRegisteredEvent,${app.messaging.queues.welcome-email}",
            "handlePasswordResetRequestedEvent,${app.messaging.queues.password-reset-email}",
            "handleAppointmentConfirmedEvent,${app.messaging.queues.appointment-confirmed-email}",
            "handleAppointmentCancelledEvent,${app.messaging.queues.appointment-cancelled-email}",
            "handleAppointmentReminderEvent,${app.messaging.queues.appointment-reminder-email}"
    })
    void listenerBindingsUseQueueProperties(String methodName, String expectedQueue) throws Exception {
        RabbitListener annotation = NotificationEventListener.class
                .getDeclaredMethod(methodName, resolveMethodParameter(methodName))
                .getAnnotation(RabbitListener.class);

        Assertions.assertNotNull(annotation);
        Assertions.assertEquals(expectedQueue, annotation.queues()[0]);
    }

    private Class<?> resolveMethodParameter(String methodName) {
        return switch (methodName) {
            case "handleUserRegisteredEvent" -> UserRegisteredEvent.class;
            case "handlePasswordResetRequestedEvent" -> PasswordResetRequestedEvent.class;
            case "handleAppointmentConfirmedEvent" -> AppointmentConfirmedEvent.class;
            case "handleAppointmentCancelledEvent" -> AppointmentCancelledEvent.class;
            case "handleAppointmentReminderEvent" -> AppointmentReminderEvent.class;
            default -> throw new IllegalArgumentException("Unknown method: " + methodName);
        };
    }
}
