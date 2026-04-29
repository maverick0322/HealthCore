package com.healthcore.agenda_service.application.events;

public record AppointmentCancelledEvent(
        String appointmentId,
        String patientId,
        String nutritionistId,
        String startTime,
        String endTime
) {
}
