package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DailyGoalsSnapshotTest {

    @Test
    void shouldCreateSnapshotFromHealthGoal() {
        HealthGoal goal = new HealthGoal(2100, 130, 220, 70, 9);

        DailyGoalsSnapshot snapshot = DailyGoalsSnapshot.fromHealthGoal(goal);

        assertEquals(2100, snapshot.targetCalories());
        assertEquals(130, snapshot.targetProtein());
        assertEquals(220, snapshot.targetCarbs());
        assertEquals(70, snapshot.targetFat());
        assertEquals(9, snapshot.targetWaterGlasses());
    }

    @Test
    void shouldRejectNullTargetCalories() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new DailyGoalsSnapshot(null, 120, 200, 60, 8)
        );

        assertEquals("Target calories must be zero or greater.", exception.getMessage());
    }

    @Test
    void shouldRejectNegativeTargetProtein() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new DailyGoalsSnapshot(2000, -1, 200, 60, 8)
        );

        assertEquals("Target protein must be zero or greater.", exception.getMessage());
    }

    @Test
    void shouldRejectNegativeTargetCarbs() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new DailyGoalsSnapshot(2000, 120, -1, 60, 8)
        );

        assertEquals("Target carbs must be zero or greater.", exception.getMessage());
    }

    @Test
    void shouldRejectNegativeTargetFat() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new DailyGoalsSnapshot(2000, 120, 200, -1, 8)
        );

        assertEquals("Target fat must be zero or greater.", exception.getMessage());
    }

    @Test
    void shouldRejectNegativeTargetWaterGlasses() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new DailyGoalsSnapshot(2000, 120, 200, 60, -1)
        );

        assertEquals("Target water glasses must be zero or greater.", exception.getMessage());
    }
}
