package com.healthcore.agenda_service.application;

public record CreateAppointmentCommand(String slotId, Long slotVersion, String locale) {
}
