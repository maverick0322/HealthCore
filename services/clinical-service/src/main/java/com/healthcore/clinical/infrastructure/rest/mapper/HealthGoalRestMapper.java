package com.healthcore.clinical.infrastructure.rest.mapper;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;

@Component
public class HealthGoalRestMapper {

    public HealthGoalResponse toResponse(HealthGoal goal) {
        return new HealthGoalResponse(
                goal.targetCalories(),
                goal.targetProtein(),
                goal.targetCarbs(),
                goal.targetFat(),
                goal.targetWaterGlasses()
        );
    }
}
