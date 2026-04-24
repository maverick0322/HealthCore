package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
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
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NutritionistAvailabilityService {

    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;

    public List<TimeSlot> generateTimeSlots(String nutritionistId, GenerateSlotsCommand command) {
        log.info("Generating slots for nutritionist {} from {} to {}", nutritionistId, command.startDate(), command.endDate());
        List<TimeSlot> createdSlots = new ArrayList<>();
        
        LocalDate currentDate = command.startDate();
        while (!currentDate.isAfter(command.endDate())) {
            LocalTime currentTime = command.startTime();
            while (currentTime.plusMinutes(command.durationMinutes()).isBefore(command.endTime()) || 
                   currentTime.plusMinutes(command.durationMinutes()).equals(command.endTime())) {
                
                Instant startInstant = currentDate.atTime(currentTime).toInstant(ZoneOffset.UTC);
                Instant endInstant = startInstant.plus(command.durationMinutes(), ChronoUnit.MINUTES);
                
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
            currentDate = currentDate.plusDays(1);
        }
        
        try {
            return timeSlotRepository.saveAll(createdSlots);
        } catch (DuplicateKeyException ex) {
            log.error("Duplicate slots detected for nutritionist {}", nutritionistId);
            throw new ConflictException("Algunos de los horarios generados ya existen.");
        }
    }

    public void deactivateTimeSlot(String nutritionistId, String slotId) {
        log.info("Deactivating slot {} for nutritionist {}", slotId, nutritionistId);
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
            // Find the associated appointment. For simplicity in this iteration we fetch all or we can use a custom query.
            // A better way is to add findBySlotIdAndStatusNotIn to the repo, but let's just do a stream since it's a bounded dataset or add the method.
            // Let's add findBySlotId to AppointmentRepository. Actually, I can use a simple loop.
            List<Appointment> nutritionistAppointments = appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(
                nutritionistId, 
                slot.getStartTime().minus(1, ChronoUnit.DAYS), 
                slot.getEndTime().plus(1, ChronoUnit.DAYS)
            );
            
            Appointment appointment = nutritionistAppointments.stream()
                .filter(a -> a.getSlotId().equals(slotId) && a.getStatus() != AppointmentStatus.CANCELLED)
                .findFirst()
                .orElse(null);
            
            if (appointment != null) {
                log.info("Cancelling appointment {} due to slot deactivation", appointment.getId());
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setUpdatedAt(Instant.now());
                appointmentRepository.save(appointment);
            }
            slot.setReserved(false);
            slot.setReservedByPatientId(null);
        }

        slot.setActive(false);
        try {
            timeSlotRepository.save(slot);
            log.info("Slot {} successfully deactivated", slotId);
        } catch (OptimisticLockingFailureException ex) {
            log.error("Optimistic locking failure while deactivating slot {}", slotId);
            throw new ConflictException("El horario fue modificado por otra transaccion, por favor intenta de nuevo");
        }
    }

    public List<TimeSlot> getNutritionistSlots(String nutritionistId, Instant from, Instant to) {
        log.debug("Fetching slots for nutritionist {} between {} and {}", nutritionistId, from, to);
        return timeSlotRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(nutritionistId, from, to);
    }

    public List<Appointment> getNutritionistAppointments(String nutritionistId, Instant from, Instant to) {
        log.debug("Fetching appointments for nutritionist {} between {} and {}", nutritionistId, from, to);
        return appointmentRepository.findByNutritionistIdAndStartTimeBetweenOrderByStartTime(nutritionistId, from, to);
    }
}
