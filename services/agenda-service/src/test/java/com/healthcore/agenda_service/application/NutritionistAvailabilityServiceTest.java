package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionistAvailabilityServiceTest {

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private NutritionistAvailabilityService service;

    @Test
    void generateTimeSlots_shouldReturnCorrectNumberOfSlots() {
        var command = new GenerateSlotsCommand(
            LocalDate.of(2026, 4, 25),
            LocalDate.of(2026, 4, 25),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            30
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result).hasSize(2);
    }

    @Test
    void generateTimeSlots_shouldSetNutritionistIdCorrectly() {
        var command = new GenerateSlotsCommand(
            LocalDate.of(2026, 4, 25),
            LocalDate.of(2026, 4, 25),
            LocalTime.of(10, 0),
            LocalTime.of(10, 30),
            30
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result.get(0).getNutritionistId()).isEqualTo("nutri-1");
    }

    @Test
    void generateTimeSlots_shouldSetSlotAsActiveAndNotReserved() {
        var command = new GenerateSlotsCommand(
            LocalDate.of(2026, 4, 25),
            LocalDate.of(2026, 4, 25),
            LocalTime.of(10, 0),
            LocalTime.of(10, 30),
            30
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result.get(0).isActive()).isTrue();
    }

    @Test
    void deactivateTimeSlot_shouldDeactivateAndCancelAppointmentIfReserved() {
        Instant futureTime = Instant.now().plus(48, ChronoUnit.HOURS);
        TimeSlot slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(futureTime)
            .endTime(futureTime.plus(30, ChronoUnit.MINUTES))
            .reserved(true)
            .active(true)
            .build();
            
        Appointment appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .status(AppointmentStatus.CONFIRMED)
            .build();

        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));
        when(appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(
            any(), any(), any()
        )).thenReturn(List.of(appointment));
        
        service.deactivateTimeSlot("nutri-1", "slot-1");

        assertThat(slot.isActive()).isFalse();
        assertThat(slot.isReserved()).isFalse();
        
        ArgumentCaptor<Appointment> appCaptor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(appCaptor.capture());
        assertThat(appCaptor.getValue().getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
    }

    @Test
    void deactivateTimeSlot_shouldThrowConflictIfWithin24Hours() {
        Instant futureTime = Instant.now().plus(12, ChronoUnit.HOURS);
        TimeSlot slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(futureTime)
            .build();

        when(timeSlotRepository.findById("slot-1")).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> service.deactivateTimeSlot("nutri-1", "slot-1"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("24 horas");
    }
}
