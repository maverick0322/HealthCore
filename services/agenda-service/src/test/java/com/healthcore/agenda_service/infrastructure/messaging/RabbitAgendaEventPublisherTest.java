package com.healthcore.agenda_service.infrastructure.messaging;

import com.healthcore.agenda_service.application.events.AppointmentCancelledEvent;
import com.healthcore.agenda_service.application.events.AppointmentConfirmedEvent;
import com.healthcore.agenda_service.application.events.AppointmentReminderEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link RabbitAgendaEventPublisher}.
 * Verifies that each event type is routed to the correct exchange and routing
 * key.
 */
@ExtendWith(MockitoExtension.class)
class RabbitAgendaEventPublisherTest {

        @Mock
        private RabbitTemplate rabbitTemplate;

        private RabbitAgendaEventPublisher publisher;

        private static final String EXCHANGE = "healthcore.agenda.events";
        private static final MessagingProperties PROPERTIES = new MessagingProperties(
                        EXCHANGE,
                        new MessagingProperties.RoutingKeys(
                                        "agenda.appointment.confirmed",
                                        "agenda.appointment.cancelled",
                                        "agenda.appointment.reminder"));

        @BeforeEach
        void setUp() {
                publisher = new RabbitAgendaEventPublisher(rabbitTemplate, PROPERTIES);
        }

        @Test
        void publishAppointmentConfirmed_shouldSendToCorrectExchangeAndRoutingKey() {
                // Arrange
                AppointmentConfirmedEvent event = new AppointmentConfirmedEvent(
                                "app-1", "patient-1", "nutri-1",
                                "2026-05-01T10:00:00Z", "2026-05-01T10:30:00Z", "es");

                // Act
                publisher.publishAppointmentConfirmed(event);

                // Assert
                ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
                verify(rabbitTemplate).convertAndSend(
                                org.mockito.ArgumentMatchers.eq(EXCHANGE),
                                org.mockito.ArgumentMatchers.eq("agenda.appointment.confirmed"),
                                payloadCaptor.capture());
                assertThat(payloadCaptor.getValue()).isInstanceOf(AppointmentConfirmedEvent.class);
                assertThat(((AppointmentConfirmedEvent) payloadCaptor.getValue()).appointmentId()).isEqualTo("app-1");
        }

        @Test
        void publishAppointmentCancelled_shouldSendToCorrectExchangeAndRoutingKey() {
                // Arrange
                AppointmentCancelledEvent event = new AppointmentCancelledEvent(
                                "app-2", "patient-2", "nutri-2", "2026-05-02T09:00:00Z", "en");

                // Act
                publisher.publishAppointmentCancelled(event);

                // Assert
                ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
                verify(rabbitTemplate).convertAndSend(
                                org.mockito.ArgumentMatchers.eq(EXCHANGE),
                                org.mockito.ArgumentMatchers.eq("agenda.appointment.cancelled"),
                                payloadCaptor.capture());
                assertThat(payloadCaptor.getValue()).isInstanceOf(AppointmentCancelledEvent.class);
                assertThat(((AppointmentCancelledEvent) payloadCaptor.getValue()).appointmentId()).isEqualTo("app-2");
        }

        @Test
        void publishAppointmentReminder_shouldSendToCorrectExchangeAndRoutingKey() {
                // Arrange
                AppointmentReminderEvent event = new AppointmentReminderEvent(
                                "app-3", "patient-3", "nutri-3", "2026-05-03T08:00:00Z", "es");

                // Act
                publisher.publishAppointmentReminder(event);

                // Assert
                ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
                verify(rabbitTemplate).convertAndSend(
                                org.mockito.ArgumentMatchers.eq(EXCHANGE),
                                org.mockito.ArgumentMatchers.eq("agenda.appointment.reminder"),
                                payloadCaptor.capture());
                assertThat(payloadCaptor.getValue()).isInstanceOf(AppointmentReminderEvent.class);
                assertThat(((AppointmentReminderEvent) payloadCaptor.getValue()).appointmentId()).isEqualTo("app-3");
        }
}
