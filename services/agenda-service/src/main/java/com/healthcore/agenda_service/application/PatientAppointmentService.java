package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.ForbiddenOperationException;
import com.healthcore.agenda_service.domain.exception.NotFoundException;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;
import com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient;
import com.healthcore.agenda_service.application.events.AppointmentCancelledEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PatientAppointmentService {
    private static final List<AppointmentStatus> ACTIVE_STATUSES = List.of(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED
    );

    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalServiceClient clinicalServiceClient;
    private final AppointmentConfirmationService appointmentConfirmationService;
    private final AgendaEventPublisher agendaEventPublisher;
    private final MeterRegistry meterRegistry;

    public List<TimeSlot> getAvailability(String nutritionistId, Instant from, Instant to) {
        Instant now = Instant.now();
        return timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime(nutritionistId, from, to)
            .stream()
            .filter(slot -> !slot.isReserved())
            .filter(slot -> slot.getStartTime().isAfter(now))
            .toList();
    }

    public Appointment createAppointment(String patientId, CreateAppointmentCommand command) {
        try {
            TimeSlot slot = timeSlotRepository.findById(command.slotId())
                .orElseThrow(() -> new NotFoundException("Slot no encontrado"));

            if (!slot.isActive() || slot.isReserved()) {
                throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
            }
            if (!Objects.equals(slot.getVersion(), command.slotVersion())) {
                throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
            }
            if (!slot.getStartTime().isAfter(Instant.now())) {
                throw new ConflictException("No puedes agendar una cita en un horario que ya pasó");
            }
            if (!clinicalServiceClient.validateLink(patientId, slot.getNutritionistId())) {
                throw new ForbiddenOperationException("No existe vinculo activo con el nutriologo");
            }

            try {
                slot.setReserved(true);
                slot.setReservedByPatientId(patientId);
                timeSlotRepository.save(slot);
            } catch (OptimisticLockingFailureException ex) {
                throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
            }

            Appointment created = appointmentRepository.save(Appointment.builder()
                .slotId(slot.getId())
                .nutritionistId(slot.getNutritionistId())
                .patientId(patientId)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status(AppointmentStatus.PENDING)
                .locale(command.locale())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

            meterRegistry.counter("agenda.appointments.created").increment();
            appointmentConfirmationService.confirmAppointmentAsync(created.getId());
            return created;
        } catch (RuntimeException ex) {
            meterRegistry.counter("agenda.appointments.create.failed").increment();
            throw ex;
        }
    }

    public void cancelAppointment(String patientId, String appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

        if (!appointment.getPatientId().equals(patientId)) {
            throw new ForbiddenOperationException("No puedes cancelar una cita de otro paciente");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return;
        }

        TimeSlot slot = timeSlotRepository.findById(appointment.getSlotId())
            .orElseThrow(() -> new NotFoundException("Slot no encontrado"));

        try {
            slot.setReserved(false);
            slot.setReservedByPatientId(null);
            timeSlotRepository.save(slot);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException("No fue posible liberar el horario, intenta nuevamente");
        }

        markCancelled(appointment, patientId, "PATIENT_CANCELLED", Instant.now());
        Appointment saved = appointmentRepository.save(appointment);

        agendaEventPublisher.publishAppointmentCancelled(new AppointmentCancelledEvent(
            saved.getId(),
            saved.getPatientId(),
            saved.getNutritionistId(),
            saved.getStartTime().toString(),
            saved.getLocale()
        ));
    }

    public List<Appointment> listAppointmentHistory(String patientId, Instant from, Instant to, List<AppointmentStatus> statuses) {
        return appointmentRepository.findByPatientIdAndStartTimeBetweenAndStatusInOrderByStartTime(
            patientId,
            from,
            to,
            normalizeStatuses(statuses)
        );
    }

    public List<Appointment> listMyUpcomingAppointments(String patientId) {
        return appointmentRepository.findByPatientIdAndStartTimeAfterAndStatusInOrderByStartTime(
            patientId,
            Instant.now(),
            ACTIVE_STATUSES
        );
    }

    public CancelFutureAppointmentsResult cancelFutureAppointmentsForUnlink(
        String patientId,
        String nutritionistId,
        String actor,
        String reason
    ) {
        Instant now = Instant.now();
        List<Appointment> appointments = appointmentRepository
            .findByPatientIdAndNutritionistIdAndStartTimeAfterAndStatusInOrderByStartTime(
                patientId,
                nutritionistId,
                now,
                ACTIVE_STATUSES
            );

        int releasedSlots = 0;
        for (Appointment appointment : appointments) {
            TimeSlot slot = timeSlotRepository.findById(appointment.getSlotId()).orElse(null);
            if (slot != null && slot.isReserved()) {
                slot.setReserved(false);
                slot.setReservedByPatientId(null);
                timeSlotRepository.save(slot);
                releasedSlots++;
            }

            markCancelled(appointment, actor, reason, now);
            Appointment saved = appointmentRepository.save(appointment);
            agendaEventPublisher.publishAppointmentCancelled(new AppointmentCancelledEvent(
                saved.getId(),
                saved.getPatientId(),
                saved.getNutritionistId(),
                saved.getStartTime().toString(),
                saved.getLocale()
            ));
        }

        return new CancelFutureAppointmentsResult(appointments.size(), releasedSlots);
    }

    public Appointment rescheduleAppointment(String patientId, String appointmentId, CreateAppointmentCommand command) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

        if (!appointment.getPatientId().equals(patientId)) {
            throw new ForbiddenOperationException("No puedes reprogramar una cita de otro paciente");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ConflictException("No puedes reprogramar una cita cancelada");
        }

        TimeSlot oldSlot = timeSlotRepository.findById(appointment.getSlotId())
            .orElseThrow(() -> new NotFoundException("Slot anterior no encontrado"));

        TimeSlot newSlot = timeSlotRepository.findById(command.slotId())
            .orElseThrow(() -> new NotFoundException("Nuevo slot no encontrado"));

        if (!newSlot.isActive() || newSlot.isReserved()) {
            throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
        }
        if (!Objects.equals(newSlot.getVersion(), command.slotVersion())) {
            throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
        }
        if (!newSlot.getStartTime().isAfter(Instant.now())) {
            throw new ConflictException("No puedes reprogramar a un horario que ya pasó");
        }
        boolean sameNutritionist = Objects.equals(appointment.getNutritionistId(), newSlot.getNutritionistId());
        if (!sameNutritionist && !clinicalServiceClient.validateLink(patientId, newSlot.getNutritionistId())) {
            throw new ForbiddenOperationException("No existe vinculo activo con el nutriologo");
        }

        try {
            oldSlot.setReserved(false);
            oldSlot.setReservedByPatientId(null);
            timeSlotRepository.save(oldSlot);

            newSlot.setReserved(true);
            newSlot.setReservedByPatientId(patientId);
            timeSlotRepository.save(newSlot);
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException("Conflicto al actualizar los horarios, por favor intenta de nuevo");
        }

        appointment.setSlotId(newSlot.getId());
        appointment.setNutritionistId(newSlot.getNutritionistId());
        appointment.setStartTime(newSlot.getStartTime());
        appointment.setEndTime(newSlot.getEndTime());
        appointment.setUpdatedAt(Instant.now());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setLocale(command.locale());
        
        Appointment updated = appointmentRepository.save(appointment);
        appointmentConfirmationService.confirmAppointmentAsync(updated.getId());
        
        return updated;
    }

    private void markCancelled(Appointment appointment, String actor, String reason, Instant timestamp) {
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(timestamp);
        appointment.setCancelledBy(actor);
        appointment.setCancellationReason(reason);
        appointment.setUpdatedAt(timestamp);
    }

    private List<AppointmentStatus> normalizeStatuses(List<AppointmentStatus> statuses) {
        return statuses == null || statuses.isEmpty()
            ? List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.ATTENDED)
            : statuses;
    }
}
