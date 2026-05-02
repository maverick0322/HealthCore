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
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

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
        sendWelcomeEmailUseCase.send(event);
    }

    @RabbitListener(queues = "${app.messaging.queues.password-reset-email}")
    public void handlePasswordResetRequestedEvent(PasswordResetRequestedEvent event) {
        sendPasswordResetEmailUseCase.send(event);
    }

    @RabbitListener(queues = "${app.messaging.queues.appointment-confirmed-email}")
    public void handleAppointmentConfirmedEvent(AppointmentConfirmedEvent event) {
        sendAppointmentConfirmedEmailUseCase.send(event);
    }

    @RabbitListener(queues = "${app.messaging.queues.appointment-cancelled-email}")
    public void handleAppointmentCancelledEvent(AppointmentCancelledEvent event) {
        sendAppointmentCancelledEmailUseCase.send(event);
    }

    @RabbitListener(queues = "${app.messaging.queues.appointment-reminder-email}")
    public void handleAppointmentReminderEvent(AppointmentReminderEvent event) {
        sendAppointmentReminderEmailUseCase.send(event);
    }
}