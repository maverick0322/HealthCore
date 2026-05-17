package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.exception.BadRequestException;
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
import java.time.ZoneId;
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

    private static final ZoneId MEXICO_CITY = ZoneId.of("America/Mexico_City");

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private NutritionistAvailabilityService service;

    @Test
    void generateTimeSlots_shouldReturnCorrectNumberOfSlots() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY).plusDays(1), block("10:00", "11:00")))
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result).hasSize(2);
    }

    @Test
    void generateTimeSlots_shouldSetNutritionistIdCorrectly() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY).plusDays(1), block("10:00", "10:30")))
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result.get(0).getNutritionistId()).isEqualTo("nutri-1");
    }

    @Test
    void generateTimeSlots_shouldSetSlotAsActiveAndNotReserved() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY).plusDays(1), block("10:00", "10:30")))
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result.get(0).isActive()).isTrue();
        assertThat(result.get(0).isReserved()).isFalse();
    }

    @Test
    void generateTimeSlots_shouldRespectConfiguredTimeZone() {
        LocalDate date = LocalDate.now(MEXICO_CITY).plusDays(1);
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(date, block("09:00", "09:30")))
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result.getFirst().getStartTime()).isEqualTo(date.atTime(9, 0).atZone(MEXICO_CITY).toInstant());
    }

    @Test
    void generateTimeSlots_shouldSupportMultipleDaysAndBlocks() {
        LocalDate firstDay = LocalDate.now(MEXICO_CITY).plusDays(1);
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(
                day(firstDay, block("09:00", "10:00"), block("15:00", "16:00")),
                day(firstDay.plusDays(1), block("11:00", "12:00"))
            )
        );
        when(timeSlotRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<TimeSlot> result = service.generateTimeSlots("nutri-1", command);

        assertThat(result).hasSize(6);
    }

    @Test
    void generateTimeSlots_shouldRejectOverlappingBlocks() {
        LocalDate date = LocalDate.now(MEXICO_CITY).plusDays(1);
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(date, block("09:00", "10:00"), block("09:30", "11:00")))
        );

        assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("solaparse");
    }

    @Test
    void generateTimeSlots_shouldRejectPastDatesInSelectedTimeZone() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY).minusDays(1), block("09:00", "10:00")))
        );

        assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("fechas pasadas");
    }

    @Test
    void generateTimeSlots_shouldRejectPastTimesForToday() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY), block("00:00", "01:00")))
        );

        assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("horas pasadas");
    }

    @Test
    void generateTimeSlots_shouldRejectBlocksOutsideVisibleCalendarHours() {
        var command = new GenerateSlotsCommand(
            MEXICO_CITY,
            30,
            List.of(day(LocalDate.now(MEXICO_CITY).plusDays(1), block("05:30", "07:00")))
        );

        assertThatThrownBy(() -> service.generateTimeSlots("nutri-1", command))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("06:00 y 21:00");
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

    private GenerateSlotsCommand.DaySchedule day(
        LocalDate date,
        GenerateSlotsCommand.TimeBlock... blocks
    ) {
        return new GenerateSlotsCommand.DaySchedule(date, List.of(blocks));
    }

    private GenerateSlotsCommand.TimeBlock block(String startTime, String endTime) {
        return new GenerateSlotsCommand.TimeBlock(LocalTime.parse(startTime), LocalTime.parse(endTime));
    }
}
