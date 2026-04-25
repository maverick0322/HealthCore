package com.healthcore.tracking.domain.port;

import com.healthcore.tracking.domain.model.FoodLog;
import java.time.LocalDateTime;
import java.util.List;

public interface FoodLogPort {
    FoodLog save(FoodLog foodLog);
    List<FoodLog> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);
}