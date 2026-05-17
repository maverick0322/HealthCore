package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PatientProfileTest {

    @Test
    void shouldCalculateHealthGoalsCorrectlyForMale() {
        LocalDate birthDate = LocalDate.now().minusYears(25);
        PatientProfile profile = createPatientProfile("user-123", birthDate);

        HealthGoal goal = profile.generateHealthGoals();

        assertNotNull(goal);
        assertEquals(2009, goal.targetCalories());
        assertTrue(goal.targetProtein() > 0);
    }

    @Test
    void shouldThrowExceptionWhenUserIdIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
                new PatientProfile(
                        null,
                        "Carlos",
                        "Gomez",
                        null,
                        70.0,
                        175.0,
                        LocalDate.now().minusYears(20),
                        Gender.FEMALE,
                        ActivityLevel.SEDENTARY,
                        "health",
                        "omnivore",
                        List.of(),
                        List.of()
                )
        );
    }

    @Test
    void shouldAddRecordToHistoryAndRecalculateGoalsWhenUpdatingWeight() {
        PatientProfile profile = createPatientProfile("user-123", LocalDate.now().minusYears(25));

        assertEquals(1, profile.getWeightHistory().size());
        assertEquals(70.0, profile.getWeightHistory().get(0).weightKg());

        HealthGoal newGoal = profile.updateWeight(72.0);

        assertEquals(72.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        assertEquals(72.0, profile.getWeightHistory().get(1).weightKg());
        assertNotNull(newGoal);
    }

    @Test
    void shouldRequireNamesAndGoalForCompletedProfile() {
        assertThrows(IllegalArgumentException.class, () ->
                new PatientProfile(
                        "user-123",
                        "Carlos1",
                        "Gomez",
                        null,
                        70.0,
                        175.0,
                        LocalDate.now().minusYears(25),
                        Gender.MALE,
                        ActivityLevel.SEDENTARY,
                        "weight-loss",
                        "omnivore",
                        List.of(),
                        List.of()
                )
        );
    }

    private PatientProfile createPatientProfile(String userId, LocalDate birthDate) {
        return new PatientProfile(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                birthDate,
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );
    }
}
