package com.healthcore.agenda_service.application;

import java.time.LocalDate;
import java.time.LocalTime;

public record GenerateSlotsCommand(
    LocalDate startDate,
    LocalDate endDate,
    LocalTime startTime,
    LocalTime endTime,
    int durationMinutes
) {
}
