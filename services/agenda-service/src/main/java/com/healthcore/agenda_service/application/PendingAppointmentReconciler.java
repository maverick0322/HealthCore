package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PendingAppointmentReconciler {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentConfirmationService appointmentConfirmationService;

    @Scheduled(fixedDelayString = "${agenda.confirmation.reconcile-delay-ms:30000}")
    public void reconcilePendingAppointments() {
        for (Appointment appointment : appointmentRepository.findTop100ByStatusOrderByCreatedAtAsc(AppointmentStatus.PENDING)) {
            appointmentConfirmationService.confirmAppointmentAsync(appointment.getId());
        }
    }
}

