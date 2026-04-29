package com.healthcore.notification_service.domain.events;

public record AppointmentCancelledEvent(
        String appointmentId,
        String patientId,
        String nutritionistId,
        String startTime,
        String endTime
) {
}
