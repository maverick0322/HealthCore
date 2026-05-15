package com.healthcore.agenda_service.api.dto;

import com.healthcore.agenda_service.domain.TimeSlotOrigin;

import java.time.Instant;

public record AvailabilitySlotResponse(
    String id,
    String nutritionistId,
    Instant startTime,
    Instant endTime,
    TimeSlotOrigin origin,
    Long version,
    boolean reserved,
    boolean active
) {
}

