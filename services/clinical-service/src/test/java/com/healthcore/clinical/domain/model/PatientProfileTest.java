package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PatientProfileTest {

    @Test
    void shouldCalculateHealthGoalsCorrectlyForMale() {
        LocalDate birthDate = ClinicalTime.today().minusYears(25);
        PatientProfile profile = createPatientProfile("user-123", birthDate);

        HealthGoal goal = profile.generateHealthGoals();

        assertNotNull(goal);
        assertEquals(2009, goal.targetCalories());
        assertTrue(goal.targetProtein() > 0);
        assertEquals(10, goal.targetWaterGlasses());
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
                        ClinicalTime.today().minusYears(20),
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
    void shouldAddRecordToHistoryAndRecalculateGoalsWhenRegisteringLatestWeight() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate latestDate = ClinicalTime.today();

        assertEquals(1, profile.getWeightHistory().size());
        assertEquals(70.0, profile.getWeightHistory().get(0).weightKg());

        HealthGoal newGoal = profile.registerWeight(72.0, latestDate);

        assertEquals(72.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        assertEquals(72.0, profile.getWeightHistory().get(1).weightKg());
        assertEquals(latestDate, profile.getWeightHistory().get(1).date());
        assertNotNull(newGoal);
    }

    @Test
    void shouldKeepCurrentWeightWhenRegisteringHistoricalWeight() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate originalDate = profile.getWeightHistory().get(0).date();

        profile.registerWeight(72.0, ClinicalTime.today());
        profile.registerWeight(68.5, originalDate.minusDays(5));

        assertEquals(72.0, profile.getWeightKg());
        assertEquals(3, profile.getWeightHistory().size());
        assertEquals(68.5, profile.getWeightHistory().get(0).weightKg());
    }

    @Test
    void shouldReplaceWeightRecordWhenSameDateIsRegisteredAgain() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate existingDate = profile.getWeightHistory().get(0).date();

        profile.registerWeight(69.5, existingDate);

        assertEquals(1, profile.getWeightHistory().size());
        assertEquals(69.5, profile.getWeightKg());
        assertEquals(69.5, profile.getWeightHistory().get(0).weightKg());
    }

    @Test
    void shouldEditHistoricalWeightWithoutChangingCurrentWeight() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate originalDate = profile.getWeightHistory().get(0).date();
        LocalDate latestDate = ClinicalTime.today();

        profile.registerWeight(72.0, latestDate);
        profile.editWeightRecord(originalDate, 68.0, originalDate.minusDays(3));

        assertEquals(72.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        assertEquals(68.0, profile.getWeightHistory().get(0).weightKg());
        assertEquals(originalDate.minusDays(3), profile.getWeightHistory().get(0).date());
    }

    @Test
    void shouldDeleteLatestWeightAndRecalculateCurrentWeight() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate latestDate = ClinicalTime.today();

        profile.registerWeight(72.0, latestDate);
        profile.deleteWeightRecord(latestDate);

        assertEquals(70.0, profile.getWeightKg());
        assertEquals(1, profile.getWeightHistory().size());
    }

    @Test
    void shouldNotDeleteLastRemainingWeightRecord() {
        PatientProfile profile = createPatientProfile("user-123", ClinicalTime.today().minusYears(25));
        LocalDate onlyDate = profile.getWeightHistory().get(0).date();

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> profile.deleteWeightRecord(onlyDate)
        );

        assertEquals("At least one weight record must remain in the profile.", exception.getMessage());
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
                        ClinicalTime.today().minusYears(25),
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
        return PatientProfile.rehydrate(
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
                List.of(),
                List.of(new WeightRecord(70.0, ClinicalTime.today().minusDays(7))),
                null,
                null
        );
    }
}
