package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.application.events.AppointmentConfirmedEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AppointmentConfirmationService {

    private final AppointmentRepository appointmentRepository;
    private final AgendaEventPublisher agendaEventPublisher;

    @Async
    public void confirmAppointmentAsync(String appointmentId) {
        long[] delaysMs = {0L, 200L, 400L};
        for (int attempt = 0; attempt < delaysMs.length; attempt++) {
            try {
                if (delaysMs[attempt] > 0) {
                    Thread.sleep(delaysMs[attempt]);
                }

                Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
                if (appointment == null || appointment.getStatus() != AppointmentStatus.PENDING) {
                    return;
                }

                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointment.setUpdatedAt(Instant.now());
                Appointment saved = appointmentRepository.save(appointment);

                agendaEventPublisher.publishAppointmentConfirmed(new AppointmentConfirmedEvent(
                    saved.getId(),
                    saved.getPatientId(),
                    saved.getNutritionistId(),
                    saved.getStartTime().toString(),
                    saved.getEndTime().toString(),
                    saved.getLocale()
                ));
                return;
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                return;
            } catch (RuntimeException ex) {
                if (attempt == delaysMs.length - 1) {
                    throw ex;
                }
            }
        }
    }
}


