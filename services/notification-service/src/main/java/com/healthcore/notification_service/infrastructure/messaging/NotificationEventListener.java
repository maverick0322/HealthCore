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
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationEventListener {

    private final SendWelcomeEmailUseCase sendWelcomeEmailUseCase;
    private final SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase;
    private final SendAppointmentConfirmedEmailUseCase sendAppointmentConfirmedEmailUseCase;
    private final SendAppointmentCancelledEmailUseCase sendAppointmentCancelledEmailUseCase;
    private final SendAppointmentReminderEmailUseCase sendAppointmentReminderEmailUseCase;

    public NotificationEventListener(
            SendWelcomeEmailUseCase sendWelcomeEmailUseCase,
            SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase,
            SendAppointmentConfirmedEmailUseCase sendAppointmentConfirmedEmailUseCase,
            SendAppointmentCancelledEmailUseCase sendAppointmentCancelledEmailUseCase,
            SendAppointmentReminderEmailUseCase sendAppointmentReminderEmailUseCase
    ) {
        this.sendWelcomeEmailUseCase = sendWelcomeEmailUseCase;
        this.sendPasswordResetEmailUseCase = sendPasswordResetEmailUseCase;
        this.sendAppointmentConfirmedEmailUseCase = sendAppointmentConfirmedEmailUseCase;
        this.sendAppointmentCancelledEmailUseCase = sendAppointmentCancelledEmailUseCase;
        this.sendAppointmentReminderEmailUseCase = sendAppointmentReminderEmailUseCase;
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

    @RabbitListener(queues = "${app.messaging.queues.appointment-confirmed-email}")
    public void handleAppointmentConfirmedEvent(AppointmentConfirmedEvent event) {
        try {
            sendAppointmentConfirmedEmailUseCase.send(event);
        } catch (RuntimeException ex) {
            log.warn("Failed to process appointment confirmed event for appointmentId={}", event.appointmentId(), ex);
        }
    }

    @RabbitListener(queues = "${app.messaging.queues.appointment-cancelled-email}")
    public void handleAppointmentCancelledEvent(AppointmentCancelledEvent event) {
        try {
            sendAppointmentCancelledEmailUseCase.send(event);
        } catch (RuntimeException ex) {
            log.warn("Failed to process appointment cancelled event for appointmentId={}", event.appointmentId(), ex);
        }
    }

    @RabbitListener(queues = "${app.messaging.queues.appointment-reminder-email}")
    public void handleAppointmentReminderEvent(AppointmentReminderEvent event) {
        try {
            sendAppointmentReminderEmailUseCase.send(event);
        } catch (RuntimeException ex) {
            log.warn("Failed to process appointment reminder event for appointmentId={}", event.appointmentId(), ex);
        }
    }
}