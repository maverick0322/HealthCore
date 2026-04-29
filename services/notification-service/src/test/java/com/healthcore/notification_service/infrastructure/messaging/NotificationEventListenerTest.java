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
}
