package com.healthcore.tracking.domain.port;

import com.healthcore.tracking.domain.model.WaterLog;

import java.time.LocalDateTime;

public interface WaterLogPort {
    WaterLog save(WaterLog waterLog);
    Integer getConsumedWaterBetween(String userId, LocalDateTime start, LocalDateTime end);
}