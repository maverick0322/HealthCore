package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
import com.healthcore.agenda_service.domain.exception.BadRequestException;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.NotFoundException;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link NutritionistAvailabilityService}.
 * Covers slot generation, validation paths, deactivation branches, and query
 * methods.
 */
@ExtendWith(MockitoExtension.class)
class NutritionistAvailabilityServiceTest {

        @Mock
        private TimeSlotRepository timeSlotRepository;

        @Mock
        private AppointmentRepository appointmentRepository;

        @InjectMocks
        private NutritionistAvailabilityService service;

        // A future date far enough ahead to pass all guards
        private static final ZoneId UTC = ZoneId.of("UTC");
        private static final LocalDate FUTURE_DATE = LocalDate.now(UTC).plusDays(2);

        // ── generateSlots ────────────────────────────────────────────────────

        @Test
        void generateSlots_shouldPersistCorrectSlotCount_forSingleBlock() {
                // Arrange: one day, one 60-min block, 30-min duration -> 2 slots
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC,
                                30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(10, 0))))));
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(eq("nutri-1"), any(), any()))
                                .thenReturn(List.of());
                when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

                // Act
                List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

                // Assert
                assertThat(result).hasSize(2);
                assertThat(result).allMatch(slot -> slot.getNutritionistId().equals("nutri-1"));
                assertThat(result).allMatch(slot -> slot.getOrigin() == TimeSlotOrigin.PREDEFINED);
                assertThat(result).allMatch(slot -> !slot.isReserved() && slot.isActive());
        }

        @Test
        void generateSlots_shouldThrowConflict_whenDuplicateKeysDetected() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC,
                                30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(9, 30))))));
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(eq("nutri-1"), any(), any()))
                                .thenReturn(List.of());
                when(timeSlotRepository.saveAll(anyList())).thenThrow(new DuplicateKeyException("dup"));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("ya existen");
        }

        @Test
        void generateSlots_shouldThrowConflict_whenBlocksOverlapExistingActive() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC,
                                30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(9, 30))))));
                Instant existingStart = FUTURE_DATE.atTime(8, 45).atZone(UTC).toInstant();
                Instant existingEnd = FUTURE_DATE.atTime(9, 15).atZone(UTC).toInstant();
                TimeSlot existingSlot = TimeSlot.builder()
                                .startTime(existingStart)
                                .endTime(existingEnd)
                                .active(true)
                                .build();
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(eq("nutri-1"), any(), any()))
                                .thenReturn(List.of(existingSlot));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("se solapan");
        }

        @Test
        void generateSlots_shouldThrowConflict_whenExactDuplicateStartTime() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC,
                                30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(9, 30))))));
                Instant existingStart = FUTURE_DATE.atTime(9, 0).atZone(UTC).toInstant();
                Instant existingEnd = FUTURE_DATE.atTime(9, 30).atZone(UTC).toInstant();
                TimeSlot existingSlot = TimeSlot.builder()
                                .startTime(existingStart)
                                .endTime(existingEnd)
                                .active(false) // inactive duplicate
                                .build();
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(eq("nutri-1"), any(), any()))
                                .thenReturn(List.of(existingSlot));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("ya existen");
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenDurationBelowMinimum() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC, 10, // minimum is 15 minutes
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(10, 0))))));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class);
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenNoDaysProvided() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(UTC, 30, List.of());

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class);
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenDateIsInThePast() {
                LocalDate pastDate = LocalDate.now(UTC).minusDays(1);
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC, 30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                pastDate,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                LocalTime.of(10, 0))))));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class);
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenDuplicateDates() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC, 30,
                                List.of(
                                                new GenerateSlotsCommand.DaySchedule(FUTURE_DATE,
                                                                List.of(new GenerateSlotsCommand.TimeBlock(
                                                                                LocalTime.of(9, 0),
                                                                                LocalTime.of(10, 0)))),
                                                new GenerateSlotsCommand.DaySchedule(FUTURE_DATE, // duplicate date
                                                                List.of(new GenerateSlotsCommand.TimeBlock(
                                                                                LocalTime.of(11, 0),
                                                                                LocalTime.of(12, 0))))));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class)
                                .hasMessageContaining("repetir fechas");
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenBlocksOverlap() {
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC, 30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(
                                                                new GenerateSlotsCommand.TimeBlock(LocalTime.of(9, 0),
                                                                                LocalTime.of(10, 30)),
                                                                new GenerateSlotsCommand.TimeBlock(LocalTime.of(10, 0),
                                                                                LocalTime.of(11, 0)) // overlaps
                                                ))));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class)
                                .hasMessageContaining("solaparse");
        }

        @Test
        void generateSlots_shouldThrowBadRequest_whenBlockOutsideAllowedHours() {
                // Block ends after 21:00
                GenerateSlotsCommand command = new GenerateSlotsCommand(
                                UTC, 30,
                                List.of(new GenerateSlotsCommand.DaySchedule(
                                                FUTURE_DATE,
                                                List.of(new GenerateSlotsCommand.TimeBlock(LocalTime.of(20, 45),
                                                                LocalTime.of(21, 30))))));

                assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
                                .isInstanceOf(BadRequestException.class)
                                .hasMessageContaining("06:00 y 21:00");
        }

        // ── deactivateTimeSlot ───────────────────────────────────────────────

        @Test
        void deactivateTimeSlot_shouldDeactivateFreeSlotSuccessfully() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(Instant.now().plus(48, ChronoUnit.HOURS))
                                .endTime(Instant.now().plus(48, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES))
                                .active(true)
                                .reserved(false)
                                .version(1L)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
                when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(i -> i.getArgument(0));

                service.deactivateTimeSlot("nutri-1", "slot-1");

                ArgumentCaptor<TimeSlot> captor = ArgumentCaptor.forClass(TimeSlot.class);
                verify(timeSlotRepository).save(captor.capture());
                assertThat(captor.getValue().isActive()).isFalse();
                assertThat(captor.getValue().getDeactivatedBy()).isEqualTo("nutri-1");
                assertThat(captor.getValue().getDeactivationReason()).isEqualTo("NUTRITIONIST_DEACTIVATED");
                assertThat(captor.getValue().getDeactivatedAt()).isNotNull();
        }

        @Test
        void deactivateTimeSlot_shouldThrowNotFound_whenSlotDoesNotExist() {
                when(timeSlotRepository.findById("ghost")).thenReturn(Optional.empty());

                assertThatThrownBy(() -> service.deactivateTimeSlot("nutri-1", "ghost"))
                                .isInstanceOf(NotFoundException.class);
        }

        @Test
        void deactivateTimeSlot_shouldThrowConflict_whenSlotBelongsToDifferentNutritionist() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-2")
                                .startTime(Instant.now().plus(48, ChronoUnit.HOURS))
                                .active(true)
                                .reserved(false)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));

                assertThatThrownBy(() -> service.deactivateTimeSlot("nutri-1", "slot-1"))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("permisos");
        }

        @Test
        void deactivateTimeSlot_shouldThrowConflict_whenSlotIsWithin24Hours() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(Instant.now().plus(2, ChronoUnit.HOURS)) // within 24h
                                .active(true)
                                .reserved(false)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));

                assertThatThrownBy(() -> service.deactivateTimeSlot("nutri-1", "slot-1"))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("24 horas");
        }

        @Test
        void deactivateTimeSlot_shouldCancelAssociatedAppointment_whenSlotIsReserved() {
                Instant slotStart = Instant.now().plus(48, ChronoUnit.HOURS);
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(slotStart)
                                .endTime(slotStart.plus(30, ChronoUnit.MINUTES))
                                .active(true)
                                .reserved(true)
                                .reservedByPatientId("patient-1")
                                .version(1L)
                                .build();

                Appointment appointment = Appointment.builder()
                                .id("app-1")
                                .slotId("slot-1")
                                .patientId("patient-1")
                                .nutritionistId("nutri-1")
                                .status(AppointmentStatus.CONFIRMED)
                                .build();

                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
                when(appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(
                                eq("nutri-1"), any(Instant.class), any(Instant.class)))
                                .thenReturn(List.of(appointment));
                when(timeSlotRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(appointmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

                service.deactivateTimeSlot("nutri-1", "slot-1");

                ArgumentCaptor<Appointment> aptCaptor = ArgumentCaptor.forClass(Appointment.class);
                verify(appointmentRepository).save(aptCaptor.capture());
                assertThat(aptCaptor.getValue().getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
                assertThat(aptCaptor.getValue().getCancelledBy()).isEqualTo("nutri-1");
                assertThat(aptCaptor.getValue().getCancellationReason()).isEqualTo("SLOT_DEACTIVATED");
                assertThat(aptCaptor.getValue().getCancelledAt()).isNotNull();

                ArgumentCaptor<TimeSlot> slotCaptor = ArgumentCaptor.forClass(TimeSlot.class);
                verify(timeSlotRepository).save(slotCaptor.capture());
                assertThat(slotCaptor.getValue().isActive()).isFalse();
                assertThat(slotCaptor.getValue().isReserved()).isFalse();
                assertThat(slotCaptor.getValue().getDeactivatedBy()).isEqualTo("nutri-1");
        }

        @Test
        void deactivateTimeSlot_shouldThrowConflict_whenOptimisticLockingFails() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(Instant.now().plus(48, ChronoUnit.HOURS))
                                .active(true)
                                .reserved(false)
                                .version(1L)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
                when(timeSlotRepository.save(any())).thenThrow(new OptimisticLockingFailureException("version"));

                assertThatThrownBy(() -> service.deactivateTimeSlot("nutri-1", "slot-1"))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("transaccion");
        }

        @Test
        void activateTimeSlot_shouldReactivateInactiveFutureSlot() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(Instant.now().plus(48, ChronoUnit.HOURS))
                                .endTime(Instant.now().plus(49, ChronoUnit.HOURS))
                                .active(false)
                                .reserved(false)
                                .deactivatedBy("nutri-1")
                                .deactivationReason("NUTRITIONIST_DEACTIVATED")
                                .deactivatedAt(Instant.now())
                                .version(1L)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
                when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(i -> i.getArgument(0));

                service.activateTimeSlot("nutri-1", "slot-1");

                assertThat(slot.isActive()).isTrue();
                assertThat(slot.getDeactivatedAt()).isNull();
                assertThat(slot.getDeactivatedBy()).isNull();
                assertThat(slot.getDeactivationReason()).isNull();
        }

        @Test
        void activateTimeSlot_shouldRejectReservedSlot() {
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .startTime(Instant.now().plus(48, ChronoUnit.HOURS))
                                .active(false)
                                .reserved(true)
                                .build();
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));

                assertThatThrownBy(() -> service.activateTimeSlot("nutri-1", "slot-1"))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("reservado");
        }

        // ── query methods ────────────────────────────────────────────────────

        @Test
        void getNutritionistSlots_shouldDelegateToRepository() {
                Instant from = Instant.parse("2026-05-01T00:00:00Z");
                Instant to = Instant.parse("2026-05-08T00:00:00Z");
                TimeSlot slot = TimeSlot.builder().id("s1").nutritionistId("nutri-1").build();
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime("nutri-1", from, to))
                                .thenReturn(List.of(slot));

                List<TimeSlot> result = service.getNutritionistSlots("nutri-1", from, to);

                assertThat(result).hasSize(1).extracting(TimeSlot::getId).containsExactly("s1");
        }

        @Test
        void getNutritionistAppointments_shouldDelegateToRepository() {
                Instant from = Instant.parse("2026-05-01T00:00:00Z");
                Instant to = Instant.parse("2026-05-08T00:00:00Z");
                Appointment apt = Appointment.builder().id("a1").nutritionistId("nutri-1").build();
                when(appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime("nutri-1", from, to))
                                .thenReturn(List.of(apt));

                List<Appointment> result = service.getNutritionistAppointments("nutri-1", from, to);

                assertThat(result).hasSize(1).extracting(Appointment::getId).containsExactly("a1");
        }

        @Test
        void getNutritionistAppointmentReport_shouldDelegateWithStatusesAndPatientFilter() {
                Instant from = Instant.parse("2026-05-01T00:00:00Z");
                Instant to = Instant.parse("2026-05-08T00:00:00Z");
                List<AppointmentStatus> statuses = List.of(AppointmentStatus.CANCELLED, AppointmentStatus.ATTENDED);
                Appointment apt = Appointment.builder().id("a1").nutritionistId("nutri-1").patientId("patient-1").build();
                when(appointmentRepository.findByNutritionistIdAndPatientIdAndStartTimeBetweenAndStatusInOrderByStartTime(
                                "nutri-1", "patient-1", from, to, statuses))
                                .thenReturn(List.of(apt));

                List<Appointment> result = service.getNutritionistAppointmentReport(
                                "nutri-1", from, to, statuses, "patient-1");

                assertThat(result).hasSize(1).extracting(Appointment::getId).containsExactly("a1");
        }

        @Test
        void getNutritionistSlotReport_shouldReturnInactiveSlotsWhenRequested() {
                Instant from = Instant.parse("2026-05-01T00:00:00Z");
                Instant to = Instant.parse("2026-05-08T00:00:00Z");
                TimeSlot slot = TimeSlot.builder().id("s1").nutritionistId("nutri-1").active(false).build();
                when(timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveFalseOrderByStartTime(
                                "nutri-1", from, to))
                                .thenReturn(List.of(slot));

                List<TimeSlot> result = service.getNutritionistSlotReport("nutri-1", from, to, "inactive");

                assertThat(result).hasSize(1).extracting(TimeSlot::getId).containsExactly("s1");
        }

        @Test
        void applyReportingSeedAdjustments_shouldRewriteAppointmentAndSlotForAttendedStatus() {
                Instant startTime = Instant.parse("2026-05-10T16:00:00Z");
                Instant endTime = Instant.parse("2026-05-10T16:30:00Z");

                Appointment appointment = Appointment.builder()
                                .id("app-1")
                                .slotId("slot-1")
                                .nutritionistId("nutri-1")
                                .patientId("patient-1")
                                .status(AppointmentStatus.PENDING)
                                .build();
                TimeSlot slot = TimeSlot.builder()
                                .id("slot-1")
                                .nutritionistId("nutri-1")
                                .reserved(false)
                                .active(true)
                                .build();

                when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));
                when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
                when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

                int updatedCount = service.applyReportingSeedAdjustments(
                                "nutri-1",
                                List.of(new NutritionistAvailabilityService.ReportingSeedAppointmentAdjustment(
                                                "app-1",
                                                startTime,
                                                endTime,
                                                AppointmentStatus.ATTENDED)));

                assertThat(updatedCount).isEqualTo(1);
                assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.ATTENDED);
                assertThat(appointment.getAttendedAt()).isNotNull();
                assertThat(appointment.getCancelledAt()).isNull();
                assertThat(slot.isReserved()).isTrue();
                assertThat(slot.getReservedByPatientId()).isEqualTo("patient-1");
                assertThat(slot.getStartTime()).isEqualTo(startTime);
                assertThat(slot.getEndTime()).isEqualTo(endTime);
        }

        @Test
        void applyReportingSeedAdjustments_shouldThrowConflictForForeignAppointment() {
                Appointment appointment = Appointment.builder()
                                .id("app-1")
                                .slotId("slot-1")
                                .nutritionistId("nutri-2")
                                .patientId("patient-1")
                                .status(AppointmentStatus.PENDING)
                                .build();

                when(appointmentRepository.findById("app-1")).thenReturn(Optional.of(appointment));

                assertThatThrownBy(() -> service.applyReportingSeedAdjustments(
                                "nutri-1",
                                List.of(new NutritionistAvailabilityService.ReportingSeedAppointmentAdjustment(
                                                "app-1",
                                                Instant.parse("2026-05-10T16:00:00Z"),
                                                Instant.parse("2026-05-10T16:30:00Z"),
                                                AppointmentStatus.ATTENDED))))
                                .isInstanceOf(ConflictException.class)
                                .hasMessageContaining("permisos");
        }
}
