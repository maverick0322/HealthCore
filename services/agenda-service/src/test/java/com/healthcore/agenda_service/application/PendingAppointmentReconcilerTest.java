package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link PendingAppointmentReconciler}.
 */
@ExtendWith(MockitoExtension.class)
class PendingAppointmentReconcilerTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentConfirmationService appointmentConfirmationService;

    @InjectMocks
    private PendingAppointmentReconciler reconciler;

    @Test
    void reconcilePendingAppointments_shouldConfirmEachPendingAppointment() {
        // Arrange
        Appointment a1 = Appointment.builder().id("app-1").status(AppointmentStatus.PENDING).build();
        Appointment a2 = Appointment.builder().id("app-2").status(AppointmentStatus.PENDING).build();
        when(appointmentRepository.findTop100ByStatusOrderByCreatedAtAsc(AppointmentStatus.PENDING))
                .thenReturn(List.of(a1, a2));

        // Act
        reconciler.reconcilePendingAppointments();

        // Assert — confirmation service called once per pending appointment
        verify(appointmentConfirmationService).confirmAppointmentAsync("app-1");
        verify(appointmentConfirmationService).confirmAppointmentAsync("app-2");
    }

    @Test
    void reconcilePendingAppointments_shouldDoNothing_whenNoPendingAppointmentsExist() {
        // Arrange
        when(appointmentRepository.findTop100ByStatusOrderByCreatedAtAsc(AppointmentStatus.PENDING))
                .thenReturn(List.of());

        // Act
        reconciler.reconcilePendingAppointments();

        // Assert
        verifyNoInteractions(appointmentConfirmationService);
    }
}
