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
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PatientAppointmentService {

    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalServiceClient clinicalServiceClient;
    private final AppointmentConfirmationService appointmentConfirmationService;

    public List<TimeSlot> getAvailability(String nutritionistId, Instant from, Instant to) {
        return timeSlotRepository.findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime(nutritionistId, from, to)
            .stream()
            .filter(slot -> !slot.isReserved())
            .toList();
    }

    public Appointment createAppointment(String patientId, CreateAppointmentCommand command) {
        TimeSlot slot = timeSlotRepository.findById(command.slotId())
            .orElseThrow(() -> new NotFoundException("Slot no encontrado"));

        if (!slot.isActive() || slot.isReserved()) {
            throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
        }
        if (!Objects.equals(slot.getVersion(), command.slotVersion())) {
            throw new ConflictException("El horario acaba de ser ocupado, por favor elige otro");
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
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build());

        appointmentConfirmationService.confirmAppointmentAsync(created.getId());
        return created;
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

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
    }

    public List<Appointment> listMyUpcomingAppointments(String patientId) {
        return appointmentRepository.findByPatientIdAndStartTimeAfterAndStatusInOrderByStartTime(
            patientId,
            Instant.now(),
            List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)
        );
    }
}


