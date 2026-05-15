package com.healthcore.agenda_service.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record GenerateSlotsRequest(
    String timeZone,
    Integer durationMinutes,
    List<DayScheduleRequest> days,

    LocalDate startDate,
    LocalDate endDate,
    LocalTime startTime,
    LocalTime endTime
) {
    public record DayScheduleRequest(
        LocalDate date,
        List<TimeBlockRequest> blocks
    ) {
    }

    public record TimeBlockRequest(
        LocalTime startTime,
        LocalTime endTime
    ) {
    }
}
