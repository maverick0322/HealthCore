package com.healthcore.agenda_service.application.events;

public record AppointmentReminderEvent(
        String appointmentId,
        String patientId,
        String nutritionistId,
        String startTime,
        String endTime
) {
}
