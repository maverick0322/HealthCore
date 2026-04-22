package com.healthcore.agenda_service.domain.repository;

import com.healthcore.agenda_service.domain.TimeSlot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface TimeSlotRepository extends MongoRepository<TimeSlot, String> {
    List<TimeSlot> findByNutritionistIdAndStartTimeBetweenAndActiveTrueOrderByStartTime(
        String nutritionistId,
        Instant from,
        Instant to
    );
}

