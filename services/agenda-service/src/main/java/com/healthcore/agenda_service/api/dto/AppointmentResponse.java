package com.healthcore.agenda_service.api.dto;

import com.healthcore.agenda_service.domain.AppointmentStatus;

import java.time.Instant;

public record AppointmentResponse(
    String id,
    String slotId,
    String nutritionistId,
    String patientId,
    Instant startTime,
    Instant endTime,
    AppointmentStatus status,
    Long version
) {
}

