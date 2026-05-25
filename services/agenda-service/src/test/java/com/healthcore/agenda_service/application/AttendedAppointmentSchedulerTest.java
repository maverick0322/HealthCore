package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class AttendedAppointmentSchedulerTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Test
    void markPastAppointmentsAsAttended_shouldMovePendingAndConfirmedAppointmentsToAttended() {
        Appointment pending = Appointment.builder()
            .id("app-pending")
            .status(AppointmentStatus.PENDING)
            .endTime(Instant.now().minusSeconds(60))
            .build();
        Appointment confirmed = Appointment.builder()
            .id("app-confirmed")
            .status(AppointmentStatus.CONFIRMED)
            .endTime(Instant.now().minusSeconds(120))
            .build();
        when(appointmentRepository.findTop100ByStatusInAndEndTimeLessThanEqualOrderByEndTimeAsc(
            eq(List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)),
            any(Instant.class)
        )).thenReturn(List.of(pending, confirmed));

        new AttendedAppointmentScheduler(appointmentRepository).markPastAppointmentsAsAttended();

        ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
            .allSatisfy(appointment -> {
                assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.ATTENDED);
                assertThat(appointment.getAttendedAt()).isNotNull();
                assertThat(appointment.getUpdatedAt()).isNotNull();
            });
    }
}
