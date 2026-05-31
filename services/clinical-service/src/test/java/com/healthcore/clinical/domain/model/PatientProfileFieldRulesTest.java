package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PatientProfileFieldRulesTest {

    @Test
    void shouldRejectBirthDateOutsideSupportedAgeRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> PatientProfileFieldRules.validateBirthDate(ClinicalTime.today().minusYears(121))
        );

        assertEquals("Birth date must represent an age between 1 and 120 years.", exception.getMessage());
    }

    @Test
    void shouldRejectHeightWithDecimals() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> PatientProfileFieldRules.validateHeightCm(170.5)
        );

        assertEquals("Height must be expressed as a whole number in centimeters.", exception.getMessage());
    }

    @Test
    void shouldRejectWeightWithMoreThanOneDecimalPlace() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> PatientProfileFieldRules.validateWeightKg(72.55)
        );

        assertEquals("Weight must use at most one decimal place.", exception.getMessage());
    }

    @Test
    void shouldValidateAndDeduplicateAllergies() {
        List<String> allergies = PatientProfileFieldRules.validateAllergies(
                List.of(" gluten ", "lactose", "gluten", " ")
        );

        assertEquals(List.of("gluten", "lactose"), allergies);
    }

    @Test
    void shouldRejectInvalidAllergyValue() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> PatientProfileFieldRules.validateAllergies(List.of("gluten", "pepper"))
        );

        assertEquals("Allergy contains an invalid value.", exception.getMessage());
    }

    @Test
    void shouldCreateWeightHistoryFromCurrentWeightWhenHistoryIsMissing() {
        List<WeightRecord> weightHistory = PatientProfileFieldRules.normalizeWeightHistory(null, 70.0);

        assertEquals(1, weightHistory.size());
        assertEquals(70.0, weightHistory.get(0).weightKg());
        assertEquals(ClinicalTime.today(), weightHistory.get(0).date());
    }

    @Test
    void shouldNormalizeWeightHistoryKeepingLatestValueForRepeatedDate() {
        LocalDate repeatedDate = ClinicalTime.today().minusDays(3);

        List<WeightRecord> weightHistory = PatientProfileFieldRules.normalizeWeightHistory(
                List.of(
                        new WeightRecord(71.0, repeatedDate),
                        new WeightRecord(68.0, repeatedDate.minusDays(2)),
                        new WeightRecord(72.5, repeatedDate)
                ),
                70.0
        );

        assertEquals(2, weightHistory.size());
        assertEquals(68.0, weightHistory.get(0).weightKg());
        assertEquals(repeatedDate.minusDays(2), weightHistory.get(0).date());
        assertEquals(72.5, weightHistory.get(1).weightKg());
        assertEquals(repeatedDate, weightHistory.get(1).date());
    }

    @Test
    void shouldReturnEmptyWeightHistoryWhenNoHistoryAndNoCurrentWeightExist() {
        List<WeightRecord> weightHistory = PatientProfileFieldRules.normalizeWeightHistory(List.of(), null);

        assertTrue(weightHistory.isEmpty());
    }
}
