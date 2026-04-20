package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class PatientProfileTest {

    @Test
    void shouldCalculateHealthGoalsCorrectlyForMale() {
        LocalDate birthDate = LocalDate.now().minusYears(25); 
        PatientProfile profile = new PatientProfile(
                "user-123",
                70.0, 
                175.0, 
                birthDate,
                Gender.MALE,
                ActivityLevel.SEDENTARY 
        );

        HealthGoal goal = profile.generateHealthGoals();

        assertNotNull(goal);

        assertEquals(2009, goal.targetCalories(), "Las calorías calculadas no coinciden con la fórmula de Mifflin-St Jeor");
        assertTrue(goal.targetProtein() > 0);
    }

    @Test
    void shouldThrowExceptionWhenUserIdIsNull() {
        assertThrows(IllegalArgumentException.class, () -> {
            new PatientProfile(null, 70.0, 175.0, LocalDate.now(), Gender.FEMALE, ActivityLevel.SEDENTARY);
        });
    }
}