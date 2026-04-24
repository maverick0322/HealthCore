package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.ForbiddenOperationException;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;
import com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientAppointmentServiceTest {

    @Mock
    private TimeSlotRepository timeSlotRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private ClinicalServiceClient clinicalServiceClient;
    @Mock
    private AppointmentConfirmationService appointmentConfirmationService;

    @InjectMocks
    private PatientAppointmentService service;

    private TimeSlot slot;

    @BeforeEach
    void setUp() {
        slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(Instant.parse("2026-04-22T10:00:00Z"))
            .endTime(Instant.parse("2026-04-22T10:30:00Z"))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();
    }

    @Test
    void createAppointment_shouldReserveSlotCreatePendingAndDispatchAsyncConfirmation() {
        var command = new CreateAppointmentCommand("slot-1", 1L);

        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(true);
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setId("app-1");
            return appointment;
        });
        doNothing().when(appointmentConfirmationService).confirmAppointmentAsync("app-1");

        Appointment result = service.createAppointment("patient-1", command);

        ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(result.getId()).isEqualTo("app-1");
        verify(appointmentConfirmationService).confirmAppointmentAsync("app-1");
    }

    @Test
    void createAppointment_shouldFailWhenClinicalLinkIsMissing() {
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(false);

        assertThatThrownBy(() -> service.createAppointment("patient-1", new CreateAppointmentCommand("slot-1", 1L)))
            .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void createAppointment_shouldFailWithFriendlyConflictWhenSlotVersionChanged() {
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(true);
        doThrow(new OptimisticLockingFailureException("stale version")).when(timeSlotRepository).save(any(TimeSlot.class));

        assertThatThrownBy(() -> service.createAppointment("patient-1", new CreateAppointmentCommand("slot-1", 1L)))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("El horario acaba de ser ocupado");
    }

    @Test
    void cancelAppointment_shouldReleaseSlotAndMarkAsCancelled() {
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .build();

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancelAppointment("patient-1", "app-1");

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(slot.isReserved()).isFalse();
        assertThat(slot.getReservedByPatientId()).isNull();
    }

    @Test
    void getAvailability_shouldOnlyReturnActiveFreeSlotsInRange() {
        when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime("nutri-1",
            Instant.parse("2026-04-22T00:00:00Z"),
            Instant.parse("2026-04-23T00:00:00Z")))
            .thenReturn(List.of(slot, slot.toBuilder().id("slot-2").reserved(true).build()));

        List<TimeSlot> availability = service.getAvailability(
            "nutri-1",
            Instant.parse("2026-04-22T00:00:00Z"),
            Instant.parse("2026-04-23T00:00:00Z")
        );

        assertThat(availability).hasSize(1);
        assertThat(availability.getFirst().getId()).isEqualTo("slot-1");
    }

    @Test
    void rescheduleAppointment_shouldUpdateAppointmentSlotAndStatus() {
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .build();
            
        TimeSlot newSlot = TimeSlot.builder()
            .id("slot-2")
            .nutritionistId("nutri-1")
            .startTime(Instant.parse("2026-04-22T11:00:00Z"))
            .endTime(Instant.parse("2026-04-22T11:30:00Z"))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();

        var command = new CreateAppointmentCommand("slot-2", 1L);

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(timeSlotRepository.findById("slot-2")).thenReturn(Optional.of(newSlot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(true);
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(i -> i.getArgument(0));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        Appointment result = service.rescheduleAppointment("patient-1", "app-1", command);

        assertThat(result.getSlotId()).isEqualTo("slot-2");
    }

    @Test
    void rescheduleAppointment_shouldThrowForbiddenIfWrongPatient() {
        Appointment appointment = Appointment.builder().id("app-1").patientId("other-patient").build();
        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));

        var command = new CreateAppointmentCommand("slot-2", 1L);

        assertThatThrownBy(() -> service.rescheduleAppointment("patient-1", "app-1", command))
            .isInstanceOf(ForbiddenOperationException.class);
    }
}
