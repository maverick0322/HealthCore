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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NutritionistAvailabilityService {
    private static final LocalTime EARLIEST_SLOT_TIME = LocalTime.of(6, 0);
    private static final LocalTime LATEST_SLOT_TIME = LocalTime.of(21, 0);

    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;

    public List<TimeSlot> generateTimeSlots(String nutritionistId, GenerateSlotsCommand command) {
        validateGenerateCommand(command);
        log.info("Generating slots for nutritionistHash={} in zone {} for {} days", logHash(nutritionistId), command.timeZone(),
                command.days().size());
        List<TimeSlot> createdSlots = new ArrayList<>();

        for (GenerateSlotsCommand.DaySchedule day : command.days()) {
            for (GenerateSlotsCommand.TimeBlock block : day.blocks()) {
                LocalTime currentTime = block.startTime();
                while (!currentTime.plusMinutes(command.durationMinutes()).isAfter(block.endTime())) {

                    Instant startInstant = day.date().atTime(currentTime).atZone(command.timeZone()).toInstant();
                    Instant endInstant = day.date()
                            .atTime(currentTime.plusMinutes(command.durationMinutes()))
                            .atZone(command.timeZone())
                            .toInstant();

                    TimeSlot slot = TimeSlot.builder()
                            .nutritionistId(nutritionistId)
                            .startTime(startInstant)
                            .endTime(endInstant)
                            .active(true)
                            .reserved(false)
                            .origin(TimeSlotOrigin.PREDEFINED)
                            .build();

                    createdSlots.add(slot);
                    currentTime = currentTime.plusMinutes(command.durationMinutes());
                }
            }
        }

        try {
            return timeSlotRepository.saveAll(createdSlots);
        } catch (DuplicateKeyException ex) {
            log.error("Duplicate slots detected for nutritionistHash={}", logHash(nutritionistId));
            throw new ConflictException("Algunos de los horarios generados ya existen.");
        }
    }

    public void deactivateTimeSlot(String nutritionistId, String slotId) {
        log.info("Deactivating slotHash={} for nutritionistHash={}", logHash(slotId), logHash(nutritionistId));
        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new NotFoundException("Slot no encontrado"));

        if (!slot.getNutritionistId().equals(nutritionistId)) {
            throw new ConflictException("No tienes permisos para desactivar este slot");
        }

        Instant now = Instant.now();
        if (slot.getStartTime().isBefore(now.plus(24, ChronoUnit.HOURS))) {
            throw new ConflictException("No puedes desactivar un slot dentro de las próximas 24 horas");
        }

        if (slot.isReserved()) {
            List<Appointment> nutritionistAppointments = appointmentRepository
                    .findByNutritionistIdAndStartTimeBetweenOrderByStartTime(
                            nutritionistId,
                            slot.getStartTime().minus(1, ChronoUnit.DAYS),
                            slot.getEndTime().plus(1, ChronoUnit.DAYS));

            Appointment appointment = nutritionistAppointments.stream()
                    .filter(a -> a.getSlotId().equals(slotId) && a.getStatus() != AppointmentStatus.CANCELLED)
                    .findFirst()
                    .orElse(null);

            if (appointment != null) {
                log.info("Cancelling appointmentHash={} due to slot deactivation", logHash(appointment.getId()));
                Instant timestamp = Instant.now();
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancelledAt(timestamp);
                appointment.setCancelledBy(nutritionistId);
                appointment.setCancellationReason("SLOT_DEACTIVATED");
                appointment.setUpdatedAt(timestamp);
                appointmentRepository.save(appointment);
            }
            slot.setReserved(false);
            slot.setReservedByPatientId(null);
        }

        Instant timestamp = Instant.now();
        slot.setActive(false);
        slot.setDeactivatedAt(timestamp);
        slot.setDeactivatedBy(nutritionistId);
        slot.setDeactivationReason("NUTRITIONIST_DEACTIVATED");
        try {
            timeSlotRepository.save(slot);
            log.info("Slot successfully deactivated. slotHash={}", logHash(slotId));
        } catch (OptimisticLockingFailureException ex) {
            log.error("Optimistic locking failure while deactivating slotHash={}", logHash(slotId));
            throw new ConflictException("El horario fue modificado por otra transaccion, por favor intenta de nuevo");
        }
    }

    public List<TimeSlot> getNutritionistSlots(String nutritionistId, Instant from, Instant to) {
        log.debug("Fetching slots for nutritionistHash={} between {} and {}", logHash(nutritionistId), from, to);
        return timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(nutritionistId, from, to);
    }

    public List<Appointment> getNutritionistAppointments(String nutritionistId, Instant from, Instant to) {
        log.debug("Fetching appointments for nutritionistHash={} between {} and {}", logHash(nutritionistId), from, to);
        return appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(nutritionistId, from, to);
    }

    public List<Appointment> getNutritionistAppointmentReport(
        String nutritionistId,
        Instant from,
        Instant to,
        List<AppointmentStatus> statuses,
        String patientId
    ) {
        List<AppointmentStatus> normalizedStatuses = statuses == null || statuses.isEmpty()
            ? List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.ATTENDED)
            : statuses;

        if (patientId != null && !patientId.isBlank()) {
            return appointmentRepository.findByNutritionistIdAndPatientIdAndStartTimeBetweenAndStatusInOrderByStartTime(
                nutritionistId,
                patientId.trim(),
                from,
                to,
                normalizedStatuses
            );
        }

        return appointmentRepository.findByNutritionistIdAndStartTimeBetweenAndStatusInOrderByStartTime(
            nutritionistId,
            from,
            to,
            normalizedStatuses
        );
    }

    public List<TimeSlot> getNutritionistSlotReport(String nutritionistId, Instant from, Instant to, String state) {
        if ("inactive".equalsIgnoreCase(state)) {
            return timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveFalseOrderByStartTime(
                nutritionistId,
                from,
                to
            );
        }
        return getNutritionistSlots(nutritionistId, from, to);
    }

    public int applyReportingSeedAdjustments(
        String nutritionistId,
        List<ReportingSeedAppointmentAdjustment> adjustments
    ) {
        if (adjustments == null || adjustments.isEmpty()) {
            throw new BadRequestException("Debes enviar al menos una cita para ajustar");
        }

        Instant now = Instant.now();
        int updatedCount = 0;

        for (ReportingSeedAppointmentAdjustment adjustment : adjustments) {
            validateReportingSeedAdjustment(adjustment);

            Appointment appointment = appointmentRepository.findById(adjustment.appointmentId())
                .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

            if (!nutritionistId.equals(appointment.getNutritionistId())) {
                throw new ConflictException("No tienes permisos para ajustar esta cita");
            }

            TimeSlot slot = timeSlotRepository.findById(appointment.getSlotId())
                .orElseThrow(() -> new NotFoundException("Slot no encontrado"));

            if (!nutritionistId.equals(slot.getNutritionistId())) {
                throw new ConflictException("No tienes permisos para ajustar este slot");
            }

            appointment.setStartTime(adjustment.startTime());
            appointment.setEndTime(adjustment.endTime());
            appointment.setStatus(adjustment.status());
            appointment.setUpdatedAt(now);

            slot.setStartTime(adjustment.startTime());
            slot.setEndTime(adjustment.endTime());
            slot.setActive(true);
            slot.setDeactivatedAt(null);
            slot.setDeactivatedBy(null);
            slot.setDeactivationReason(null);

            if (adjustment.status() == AppointmentStatus.CANCELLED) {
                appointment.setAttendedAt(null);
                appointment.setCancelledAt(now);
                appointment.setCancelledBy(nutritionistId);
                appointment.setCancellationReason("DEV_REPORT_SEED");
                slot.setReserved(false);
                slot.setReservedByPatientId(null);
            } else {
                appointment.setCancelledAt(null);
                appointment.setCancelledBy(null);
                appointment.setCancellationReason(null);
                appointment.setAttendedAt(adjustment.status() == AppointmentStatus.ATTENDED ? now : null);
                slot.setReserved(true);
                slot.setReservedByPatientId(appointment.getPatientId());
            }

            timeSlotRepository.save(slot);
            appointmentRepository.save(appointment);
            updatedCount += 1;
        }

        return updatedCount;
    }

    private void validateGenerateCommand(GenerateSlotsCommand command) {
        if (command == null || command.timeZone() == null) {
            throw new BadRequestException("Zona horaria requerida");
        }
        if (command.durationMinutes() < 15) {
            throw new BadRequestException("La duracion minima de una cita es de 15 minutos");
        }
        if (command.days() == null || command.days().isEmpty()) {
            throw new BadRequestException("Debes seleccionar al menos un dia");
        }

        LocalDate today = LocalDate.now(command.timeZone());
        Set<LocalDate> seenDates = new HashSet<>();
        Instant now = Instant.now();
        for (GenerateSlotsCommand.DaySchedule day : command.days()) {
            validateDay(command, day, today, now, seenDates);
        }
    }

    private void validateDay(
        GenerateSlotsCommand command,
        GenerateSlotsCommand.DaySchedule day,
        LocalDate today,
        Instant now,
        Set<LocalDate> seenDates
    ) {
        if (day == null || day.date() == null) {
            throw new BadRequestException("Cada dia debe incluir una fecha");
        }
        if (day.date().isBefore(today)) {
            throw new BadRequestException("No puedes generar horarios en fechas pasadas");
        }
        if (!seenDates.add(day.date())) {
            throw new BadRequestException("No puedes repetir fechas en la solicitud");
        }
        if (day.blocks() == null || day.blocks().isEmpty()) {
            throw new BadRequestException("Cada dia debe incluir al menos un bloque de horario");
        }

        for (GenerateSlotsCommand.TimeBlock block : day.blocks()) {
            validateBlockShape(block);
        }

        List<GenerateSlotsCommand.TimeBlock> sortedBlocks = day.blocks().stream()
                .sorted((left, right) -> left.startTime().compareTo(right.startTime()))
                .toList();
        LocalTime previousEndTime = null;
        for (GenerateSlotsCommand.TimeBlock block : sortedBlocks) {
            validateBlock(command, day.date(), block, previousEndTime, now);
            previousEndTime = block.endTime();
        }
    }

    private void validateBlock(
        GenerateSlotsCommand command,
        LocalDate date,
        GenerateSlotsCommand.TimeBlock block,
        LocalTime previousEndTime,
        Instant now
    ) {
        if (!block.startTime().isBefore(block.endTime())) {
            throw new BadRequestException("La hora inicial del bloque debe ser anterior a la hora final");
        }
        if (block.startTime().plusMinutes(command.durationMinutes()).isAfter(block.endTime())) {
            throw new BadRequestException("Cada bloque debe permitir al menos una cita completa");
        }
        if (previousEndTime != null && block.startTime().isBefore(previousEndTime)) {
            throw new BadRequestException("Los bloques de un mismo dia no pueden solaparse");
        }
        if (!date.atTime(block.startTime()).atZone(command.timeZone()).toInstant().isAfter(now)) {
            throw new BadRequestException("No puedes generar horarios en horas pasadas");
        }
        if (block.startTime().isBefore(EARLIEST_SLOT_TIME) || block.endTime().isAfter(LATEST_SLOT_TIME)) {
            throw new BadRequestException("Los horarios deben estar entre 06:00 y 21:00");
        }
    }

    private void validateBlockShape(GenerateSlotsCommand.TimeBlock block) {
        if (block == null || block.startTime() == null || block.endTime() == null) {
            throw new BadRequestException("Cada bloque debe incluir hora de inicio y fin");
        }
    }

    private void validateReportingSeedAdjustment(ReportingSeedAppointmentAdjustment adjustment) {
        if (adjustment == null || adjustment.appointmentId() == null || adjustment.appointmentId().isBlank()) {
            throw new BadRequestException("Cada ajuste debe incluir una cita");
        }
        if (adjustment.startTime() == null || adjustment.endTime() == null || adjustment.status() == null) {
            throw new BadRequestException("Cada ajuste debe incluir inicio, fin y estado");
        }
        if (!adjustment.startTime().isBefore(adjustment.endTime())) {
            throw new BadRequestException("La fecha inicial de la cita debe ser anterior a la final");
        }
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }

    public record ReportingSeedAppointmentAdjustment(
        String appointmentId,
        Instant startTime,
        Instant endTime,
        AppointmentStatus status
    ) {
    }
}
