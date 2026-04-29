package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.application.events.AppointmentReminderEvent;
import com.healthcore.agenda_service.application.ports.AgendaEventPublisher;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final AgendaEventPublisher agendaEventPublisher;
    private final int leadTimeHours;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            AgendaEventPublisher agendaEventPublisher,
            @Value("${agenda.reminders.lead-time-hours:24}") int leadTimeHours
    ) {
        this.appointmentRepository = appointmentRepository;
        this.agendaEventPublisher = agendaEventPublisher;
        this.leadTimeHours = leadTimeHours;
    }

    @Scheduled(fixedDelayString = "${agenda.reminders.delay-ms:86400000}")
    public void sendReminders() {
        Instant windowStart = Instant.now().plus(leadTimeHours, ChronoUnit.HOURS);
        Instant windowEnd = windowStart.plus(24, ChronoUnit.HOURS);

        List<Appointment> appointments = appointmentRepository.findByStatusAndStartTimeBetween(
                AppointmentStatus.CONFIRMED,
                windowStart,
                windowEnd
        );

        for (Appointment appointment : appointments) {
            agendaEventPublisher.publishAppointmentReminder(new AppointmentReminderEvent(
                    appointment.getId(),
                    appointment.getPatientId(),
                    appointment.getNutritionistId(),
                    appointment.getStartTime().toString(),
                    appointment.getEndTime().toString()
            ));
        }
    }
}
