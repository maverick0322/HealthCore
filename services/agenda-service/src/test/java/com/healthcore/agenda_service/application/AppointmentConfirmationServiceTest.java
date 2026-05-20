package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.application.events.AppointmentConfirmedEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AppointmentConfirmationService}.
 *
 * The method is {@code @Async} in production but is called synchronously in tests
 * because there is no Spring context — Mockito wires the dependencies directly.
 */
@ExtendWith(MockitoExtension.class)
class AppointmentConfirmationServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AgendaEventPublisher agendaEventPublisher;

    @InjectMocks
    private AppointmentConfirmationService confirmationService;

    private Appointment pendingAppointment;

    @BeforeEach
    void setUp() {
        pendingAppointment = Appointment.builder()
                .id("app-1")
                .patientId("patient-1")
                .nutritionistId("nutri-1")
                .startTime(Instant.parse("2026-05-01T10:00:00Z"))
                .endTime(Instant.parse("2026-05-01T10:30:00Z"))
                .status(AppointmentStatus.PENDING)
                .locale("es")
                .build();
    }

    @Test
    void confirmAppointmentAsync_shouldConfirmAndPublishEvent_whenAppointmentIsPending() {
        // Arrange
        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(pendingAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        confirmationService.confirmAppointmentAsync("app-1");

        // Assert — appointment saved with CONFIRMED status
        ArgumentCaptor<Appointment> savedCaptor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getStatus()).isEqualTo(AppointmentStatus.CONFIRMED);

        // Assert — event published
        ArgumentCaptor<AppointmentConfirmedEvent> eventCaptor = ArgumentCaptor.forClass(AppointmentConfirmedEvent.class);
        verify(agendaEventPublisher).publishAppointmentConfirmed(eventCaptor.capture());
        assertThat(eventCaptor.getValue().appointmentId()).isEqualTo("app-1");
        assertThat(eventCaptor.getValue().locale()).isEqualTo("es");
    }

    @Test
    void confirmAppointmentAsync_shouldDoNothing_whenAppointmentNotFound() {
        // Arrange
        when(appointmentRepository.findById("missing")).thenReturn(Optional.empty());

        // Act
        confirmationService.confirmAppointmentAsync("missing");

        // Assert — no save or publish
        verify(appointmentRepository, never()).save(any());
        verifyNoInteractions(agendaEventPublisher);
    }

    @Test
    void confirmAppointmentAsync_shouldDoNothing_whenAppointmentAlreadyConfirmed() {
        // Arrange
        Appointment confirmed = pendingAppointment.toBuilder().status(AppointmentStatus.CONFIRMED).build();
        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(confirmed));

        // Act
        confirmationService.confirmAppointmentAsync("app-1");

        // Assert — status is not PENDING so save and publish must not be called
        verify(appointmentRepository, never()).save(any());
        verifyNoInteractions(agendaEventPublisher);
    }

    @Test
    void confirmAppointmentAsync_shouldDoNothing_whenAppointmentIsCancelled() {
        // Arrange
        Appointment cancelled = pendingAppointment.toBuilder().status(AppointmentStatus.CANCELLED).build();
        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(cancelled));

        // Act
        confirmationService.confirmAppointmentAsync("app-1");

        // Assert
        verify(appointmentRepository, never()).save(any());
        verifyNoInteractions(agendaEventPublisher);
    }

    @Test
    void confirmAppointmentAsync_shouldRetryAndSucceed_whenFirstAttemptThrows() {
        // Arrange — first call to findById throws, second succeeds
        when(appointmentRepository.findById("app-1"))
                .thenThrow(new RuntimeException("transient"))
                .thenReturn(Optional.of(pendingAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        confirmationService.confirmAppointmentAsync("app-1");

        // Assert — eventually confirmed
        verify(appointmentRepository, times(2)).findById("app-1");
        verify(agendaEventPublisher).publishAppointmentConfirmed(any());
    }
}
