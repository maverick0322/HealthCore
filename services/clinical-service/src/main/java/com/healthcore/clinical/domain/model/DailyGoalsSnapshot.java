package com.healthcore.clinical.domain.model;

public record DailyGoalsSnapshot(
        Integer targetCalories,
        Integer targetProtein,
        Integer targetCarbs,
        Integer targetFat,
        Integer targetWaterGlasses
) {
    public DailyGoalsSnapshot {
        if (targetCalories == null || targetCalories < 0) {
            throw new IllegalArgumentException("Target calories must be zero or greater.");
        }
        if (targetProtein == null || targetProtein < 0) {
            throw new IllegalArgumentException("Target protein must be zero or greater.");
        }
        if (targetCarbs == null || targetCarbs < 0) {
            throw new IllegalArgumentException("Target carbs must be zero or greater.");
        }
        if (targetFat == null || targetFat < 0) {
            throw new IllegalArgumentException("Target fat must be zero or greater.");
        }
        if (targetWaterGlasses == null || targetWaterGlasses < 0) {
            throw new IllegalArgumentException("Target water glasses must be zero or greater.");
        }
    }

    public static DailyGoalsSnapshot fromHealthGoal(HealthGoal healthGoal) {
        return new DailyGoalsSnapshot(
                healthGoal.targetCalories(),
                healthGoal.targetProtein(),
                healthGoal.targetCarbs(),
                healthGoal.targetFat(),
                healthGoal.targetWaterGlasses()
        );
    }
}
