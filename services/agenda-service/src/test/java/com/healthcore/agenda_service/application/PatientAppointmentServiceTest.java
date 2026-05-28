package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
import com.healthcore.agenda_service.domain.exception.ClinicalServiceUnavailableException;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.ForbiddenOperationException;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;
import com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient;
import com.healthcore.agenda_service.application.events.AppointmentCancelledEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import io.micrometer.core.instrument.MeterRegistry;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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
    @Mock
    private AgendaEventPublisher agendaEventPublisher;

    @Mock
    private MeterRegistry meterRegistry;

    @InjectMocks
    private PatientAppointmentService service;

    private TimeSlot slot;

    @BeforeEach
    void setUp() {
        // Use relative future times so the temporal guard never fires on baseline fixtures
        Instant base = Instant.now().plusSeconds(86400);
        slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(base)
            .endTime(base.plusSeconds(1800))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();
    }

    @Test
    void createAppointment_shouldReserveSlotCreatePendingAndDispatchAsyncConfirmation() {
        var command = new CreateAppointmentCommand("slot-1", 1L, "es");

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
        assertThat(captor.getValue().getLocale()).isEqualTo("es");
        assertThat(result.getId()).isEqualTo("app-1");
        verify(appointmentConfirmationService).confirmAppointmentAsync("app-1");
    }

    @Test
    void createAppointment_shouldFailWhenClinicalLinkIsMissing() {
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(false);

        assertThatThrownBy(() -> service.createAppointment("patient-1", new CreateAppointmentCommand("slot-1", 1L, "es")))
            .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void createAppointment_shouldFailClosedWhenClinicalValidationIsUnavailable() {
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1"))
            .thenThrow(new ClinicalServiceUnavailableException("clinical unavailable"));

        assertThatThrownBy(() -> service.createAppointment("patient-1", new CreateAppointmentCommand("slot-1", 1L, "es")))
            .isInstanceOf(ClinicalServiceUnavailableException.class);
    }

    @Test
    void createAppointment_shouldFailWithFriendlyConflictWhenSlotVersionChanged() {
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-1")).thenReturn(true);
        doThrow(new OptimisticLockingFailureException("stale version")).when(timeSlotRepository).save(any(TimeSlot.class));

        assertThatThrownBy(() -> service.createAppointment("patient-1", new CreateAppointmentCommand("slot-1", 1L, "es")))
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
            .locale("es")
            .build();

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancelAppointment("patient-1", "app-1");

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(appointment.getCancelledBy()).isEqualTo("patient-1");
        assertThat(appointment.getCancellationReason()).isEqualTo("PATIENT_CANCELLED");
        assertThat(appointment.getCancelledAt()).isNotNull();
        assertThat(slot.isReserved()).isFalse();
        assertThat(slot.getReservedByPatientId()).isNull();
        verify(agendaEventPublisher).publishAppointmentCancelled(any(AppointmentCancelledEvent.class));
    }

    @Test
    void cancelFutureAppointmentsForUnlink_shouldCancelOnlyFutureActiveAppointmentsAndReleaseSlots() {
        TimeSlot reservedSlot = slot.toBuilder()
            .reserved(true)
            .reservedByPatientId("patient-1")
            .build();
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .startTime(Instant.now().plusSeconds(3600))
            .endTime(Instant.now().plusSeconds(5400))
            .status(AppointmentStatus.CONFIRMED)
            .locale("es")
            .build();

        when(appointmentRepository.findByPatientIdAndNutritionistIdAndStartTimeAfterAndStatusInOrderByStartTime(
            eq("patient-1"),
            eq("nutri-1"),
            any(Instant.class),
            eq(List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED))
        )).thenReturn(List.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(reservedSlot));
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CancelFutureAppointmentsResult result = service.cancelFutureAppointmentsForUnlink(
            "patient-1",
            "nutri-1",
            "patient-1",
            "PATIENT_UNLINKED"
        );

        assertThat(result.cancelledCount()).isEqualTo(1);
        assertThat(result.releasedSlotCount()).isEqualTo(1);
        assertThat(reservedSlot.isReserved()).isFalse();
        assertThat(reservedSlot.getReservedByPatientId()).isNull();
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(appointment.getCancelledBy()).isEqualTo("patient-1");
        assertThat(appointment.getCancellationReason()).isEqualTo("PATIENT_UNLINKED");
        assertThat(appointment.getCancelledAt()).isNotNull();
        verify(agendaEventPublisher).publishAppointmentCancelled(any(AppointmentCancelledEvent.class));
    }

    @Test
    void getAvailability_shouldOnlyReturnActiveFreeSlotsInRange() {
        Instant from = Instant.now();
        Instant to   = Instant.now().plusSeconds(86400 * 7);
        when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime(
            eq("nutri-1"), any(Instant.class), any(Instant.class)))
            .thenReturn(List.of(slot, slot.toBuilder().id("slot-2").reserved(true).build()));

        List<TimeSlot> availability = service.getAvailability("nutri-1", from, to);

        assertThat(availability).hasSize(1);
        assertThat(availability.getFirst().getId()).isEqualTo("slot-1");
    }

    @Test
    void getAvailability_shouldExcludeSlotsInThePast() {
        // startTime is in the past so the slot must be filtered out
        TimeSlot pastSlot = slot.toBuilder()
            .id("slot-past")
            .startTime(Instant.now().minusSeconds(3600))
            .endTime(Instant.now().minusSeconds(1800))
            .build();
        TimeSlot futureSlot = slot.toBuilder()
            .id("slot-future")
            .startTime(Instant.now().plusSeconds(3600))
            .endTime(Instant.now().plusSeconds(5400))
            .build();

        Instant from = Instant.now().minusSeconds(7200);
        Instant to   = Instant.now().plusSeconds(7200);
        when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime(
            "nutri-1", from, to))
            .thenReturn(List.of(pastSlot, futureSlot));

        List<TimeSlot> availability = service.getAvailability("nutri-1", from, to);

        assertThat(availability).hasSize(1);
        assertThat(availability.getFirst().getId()).isEqualTo("slot-future");
    }

    @Test
    void createAppointment_shouldRejectPastSlot() {
        TimeSlot pastSlot = slot.toBuilder()
            .startTime(Instant.now().minusSeconds(3600))
            .endTime(Instant.now().minusSeconds(1800))
            .build();
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(pastSlot));

        assertThatThrownBy(() -> service.createAppointment(
            "patient-1", new CreateAppointmentCommand("slot-1", 1L, "es")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("ya pas");
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
            .locale("en")
            .build();
            
        Instant newBase = Instant.now().plusSeconds(86400 * 2);
        TimeSlot newSlot = TimeSlot.builder()
            .id("slot-2")
            .nutritionistId("nutri-1")
            .startTime(newBase)
            .endTime(newBase.plusSeconds(1800))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();

        var command = new CreateAppointmentCommand("slot-2", 1L, "es");

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(timeSlotRepository.findById("slot-2")).thenReturn(Optional.of(newSlot));
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(i -> i.getArgument(0));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        Appointment result = service.rescheduleAppointment("patient-1", "app-1", command);

        assertThat(result.getSlotId()).isEqualTo("slot-2");
        assertThat(result.getLocale()).isEqualTo("es");
        verify(clinicalServiceClient, never()).validateLink("patient-1", "nutri-1");
    }

    @Test
    void rescheduleAppointment_shouldFailClosedWhenClinicalValidationIsUnavailable() {
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .build();

        Instant newBase = Instant.now().plusSeconds(86400 * 2);
        TimeSlot newSlot = TimeSlot.builder()
            .id("slot-2")
            .nutritionistId("nutri-2")
            .startTime(newBase)
            .endTime(newBase.plusSeconds(1800))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(timeSlotRepository.findById("slot-2")).thenReturn(Optional.of(newSlot));
        when(clinicalServiceClient.validateLink("patient-1", "nutri-2"))
            .thenThrow(new ClinicalServiceUnavailableException("clinical unavailable"));

        assertThatThrownBy(() -> service.rescheduleAppointment(
            "patient-1",
            "app-1",
            new CreateAppointmentCommand("slot-2", 1L, "es")
        )).isInstanceOf(ClinicalServiceUnavailableException.class);
    }

    @Test
    void rescheduleAppointment_shouldThrowForbiddenIfWrongPatient() {
        Appointment appointment = Appointment.builder().id("app-1").patientId("other-patient").build();
        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));

        var command = new CreateAppointmentCommand("slot-2", 1L, "es");

        assertThatThrownBy(() -> service.rescheduleAppointment("patient-1", "app-1", command))
            .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void rescheduleAppointment_shouldRejectPastNewSlot() {
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .locale("es")
            .build();

        TimeSlot pastNewSlot = slot.toBuilder()
            .id("slot-2")
            .startTime(Instant.now().minusSeconds(3600))
            .endTime(Instant.now().minusSeconds(1800))
            .reserved(false)
            .active(true)
            .version(1L)
            .build();

        when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(timeSlotRepository.findById("slot-2")).thenReturn(Optional.of(pastNewSlot));

        assertThatThrownBy(() -> service.rescheduleAppointment(
            "patient-1", "app-1", new CreateAppointmentCommand("slot-2", 1L, "es")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("ya pas");
    }
}

