package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.application.events.AppointmentReminderEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentReminderSchedulerTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AgendaEventPublisher agendaEventPublisher;

    @Test
    void sendReminders_shouldPublishEvents_whenConfirmedAppointmentsExistWithinWindow() {
        // Arrange
        int leadTimeHours = 24;
        AppointmentReminderScheduler scheduler = new AppointmentReminderScheduler(
                appointmentRepository,
                agendaEventPublisher,
                leadTimeHours
        );

        Appointment app1 = Appointment.builder()
                .id("app-1")
                .patientId("patient-1")
                .nutritionistId("nutritionist-1")
                .status(AppointmentStatus.CONFIRMED)
                .startTime(Instant.now().plus(25, ChronoUnit.HOURS))
                .locale("es")
                .build();

        Appointment app2 = Appointment.builder()
                .id("app-2")
                .patientId("patient-2")
                .nutritionistId("nutritionist-2")
                .status(AppointmentStatus.CONFIRMED)
                .startTime(Instant.now().plus(30, ChronoUnit.HOURS))
                .locale("en")
                .build();

        when(appointmentRepository.findByStatusAndStartTimeBetween(
                eq(AppointmentStatus.CONFIRMED),
                any(Instant.class),
                any(Instant.class)
        )).thenReturn(List.of(app1, app2));

        // Act
        scheduler.sendReminders();

        // Assert
        ArgumentCaptor<AppointmentReminderEvent> captor = ArgumentCaptor.forClass(AppointmentReminderEvent.class);
        verify(agendaEventPublisher, times(2)).publishAppointmentReminder(captor.capture());

        List<AppointmentReminderEvent> events = captor.getAllValues();
        assertThat(events).hasSize(2);

        assertThat(events.get(0).appointmentId()).isEqualTo("app-1");
        assertThat(events.get(0).patientId()).isEqualTo("patient-1");
        assertThat(events.get(0).nutritionistId()).isEqualTo("nutritionist-1");
        assertThat(events.get(0).startTime()).isEqualTo(app1.getStartTime().toString());
        assertThat(events.get(0).locale()).isEqualTo("es");

        assertThat(events.get(1).appointmentId()).isEqualTo("app-2");
        assertThat(events.get(1).patientId()).isEqualTo("patient-2");
        assertThat(events.get(1).nutritionistId()).isEqualTo("nutritionist-2");
        assertThat(events.get(1).startTime()).isEqualTo(app2.getStartTime().toString());
        assertThat(events.get(1).locale()).isEqualTo("en");
    }

    @Test
    void sendReminders_shouldDoNothing_whenNoAppointmentsExistWithinWindow() {
        // Arrange
        int leadTimeHours = 24;
        AppointmentReminderScheduler scheduler = new AppointmentReminderScheduler(
                appointmentRepository,
                agendaEventPublisher,
                leadTimeHours
        );

        when(appointmentRepository.findByStatusAndStartTimeBetween(
                eq(AppointmentStatus.CONFIRMED),
                any(Instant.class),
                any(Instant.class)
        )).thenReturn(List.of());

        // Act
        scheduler.sendReminders();

        // Assert
        verifyNoInteractions(agendaEventPublisher);
    }
}
