package com.healthcore.agenda_service.application.events;

public record AppointmentConfirmedEvent(
        String appointmentId,
        String patientId,
        String nutritionistId,
        String startTime,
        String endTime
) {
}
