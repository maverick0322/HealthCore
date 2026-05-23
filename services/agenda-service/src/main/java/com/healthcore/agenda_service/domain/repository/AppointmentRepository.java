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

    List<Appointment> findByPatientIdAndStartTimeBetweenAndStatusInOrderByStartTime(
        String patientId,
        Instant from,
        Instant to,
        List<AppointmentStatus> statuses
    );

    List<Appointment> findTop100ByStatusOrderByCreatedAtAsc(AppointmentStatus status);

    List<Appointment> findTop100ByStatusInAndEndTimeLessThanEqualOrderByEndTimeAsc(
        List<AppointmentStatus> statuses,
        Instant now
    );

    List<Appointment> findByNutritionistIdAndStartTimeBetweenOrderByStartTime(
        String nutritionistId,
        Instant from,
        Instant to
    );

    List<Appointment> findByNutritionistIdAndStartTimeBetweenAndStatusInOrderByStartTime(
        String nutritionistId,
        Instant from,
        Instant to,
        List<AppointmentStatus> statuses
    );

    List<Appointment> findByNutritionistIdAndPatientIdAndStartTimeBetweenAndStatusInOrderByStartTime(
        String nutritionistId,
        String patientId,
        Instant from,
        Instant to,
        List<AppointmentStatus> statuses
    );

    List<Appointment> findByPatientIdAndNutritionistIdAndStartTimeAfterAndStatusInOrderByStartTime(
        String patientId,
        String nutritionistId,
        Instant now,
        List<AppointmentStatus> statuses
    );

    List<Appointment> findByStatusAndStartTimeBetween(AppointmentStatus status, Instant from, Instant to);
}

