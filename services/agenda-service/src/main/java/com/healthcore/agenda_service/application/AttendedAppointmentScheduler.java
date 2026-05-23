package com.healthcore.agenda_service.application;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AttendedAppointmentScheduler {

    private static final List<AppointmentStatus> ATTENDABLE_STATUSES = List.of(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED
    );

    private final AppointmentRepository appointmentRepository;

    @Scheduled(fixedDelayString = "${agenda.attended.reconcile-delay-ms:300000}")
    public void markPastAppointmentsAsAttended() {
        Instant now = Instant.now();
        List<Appointment> appointments = appointmentRepository
            .findTop100ByStatusInAndEndTimeLessThanEqualOrderByEndTimeAsc(ATTENDABLE_STATUSES, now);

        for (Appointment appointment : appointments) {
            appointment.setStatus(AppointmentStatus.ATTENDED);
            appointment.setAttendedAt(now);
            appointment.setUpdatedAt(now);
            appointmentRepository.save(appointment);
            log.info("Marked appointmentHash={} as attended", hash(appointment.getId()));
        }
    }

    private String hash(String value) {
        return value == null ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
