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
                when(timeSlotRepository.saveAll(anyList())).thenThrow(new DuplicateKeyException("dup"));

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

                ArgumentCaptor<TimeSlot> slotCaptor = ArgumentCaptor.forClass(TimeSlot.class);
                verify(timeSlotRepository).save(slotCaptor.capture());
                assertThat(slotCaptor.getValue().isActive()).isFalse();
                assertThat(slotCaptor.getValue().isReserved()).isFalse();
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
}
