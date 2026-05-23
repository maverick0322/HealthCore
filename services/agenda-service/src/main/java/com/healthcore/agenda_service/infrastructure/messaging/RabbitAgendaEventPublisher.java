package com.healthcore.agenda_service.infrastructure.messaging;

import com.healthcore.agenda_service.application.events.AppointmentCancelledEvent;
import com.healthcore.agenda_service.application.events.AppointmentConfirmedEvent;
import com.healthcore.agenda_service.application.events.AppointmentReminderEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RabbitAgendaEventPublisher implements AgendaEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties messagingProperties;

    @Override
    public void publishAppointmentConfirmed(AppointmentConfirmedEvent event) {
        log.debug("Publishing AppointmentConfirmedEvent appointmentHash={}", hash(event.appointmentId()));
        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKeys().appointmentConfirmed(),
                event
        );
    }

    @Override
    public void publishAppointmentCancelled(AppointmentCancelledEvent event) {
        log.debug("Publishing AppointmentCancelledEvent appointmentHash={}", hash(event.appointmentId()));
        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKeys().appointmentCancelled(),
                event
        );
    }

    @Override
    public void publishAppointmentReminder(AppointmentReminderEvent event) {
        log.debug("Publishing AppointmentReminderEvent appointmentHash={}", hash(event.appointmentId()));
        rabbitTemplate.convertAndSend(
                messagingProperties.exchange(),
                messagingProperties.routingKeys().appointmentReminder(),
                event
        );
    }

    private String hash(String value) {
        return value == null ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
