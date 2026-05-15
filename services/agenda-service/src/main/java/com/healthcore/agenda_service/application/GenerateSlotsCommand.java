package com.healthcore.agenda_service.application;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

public record GenerateSlotsCommand(
    ZoneId timeZone,
    int durationMinutes,
    List<DaySchedule> days
) {
    public record DaySchedule(
        LocalDate date,
        List<TimeBlock> blocks
    ) {
    }

    public record TimeBlock(
        LocalTime startTime,
        LocalTime endTime
    ) {
    }
}
