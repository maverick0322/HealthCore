package com.healthcore.agenda_service.domain.repository;

import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByPatientIdAndStartTimeAfterAndStatusInOrderByStartTime(
        String patientId,
        Instant now,
        List<AppointmentStatus> statuses
    );

    List<Appointment> findTop100ByStatusOrderByCreatedAtAsc(AppointmentStatus status);
}

