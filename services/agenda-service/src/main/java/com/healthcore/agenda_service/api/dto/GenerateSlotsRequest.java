package com.healthcore.agenda_service.api.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record GenerateSlotsRequest(
    @NotNull @FutureOrPresent LocalDate startDate,
    @NotNull @FutureOrPresent LocalDate endDate,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    @Min(15) int durationMinutes
) {
}
