package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileFieldValidatorTest {

    @Test
    void shouldRejectBirthDateInFuture() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileFieldValidator.validateBirthDate(ClinicalTime.today().plusDays(1))
        );

        assertEquals("Birth date cannot be in the future.", exception.getMessage());
    }

    @Test
    void shouldRejectProfessionalLicenseWithNonDigits() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileFieldValidator.validateProfessionalLicense("123A567")
        );

        assertEquals("Professional license must contain only digits.", exception.getMessage());
    }

    @Test
    void shouldNormalizeWeightHistoryKeepingLatestValueForRepeatedDate() {
        LocalDate repeatedDate = ClinicalTime.today().minusDays(3);

        List<WeightRecord> normalizedHistory = ProfileFieldValidator.normalizeWeightHistory(
                List.of(
                        new WeightRecord(71.0, repeatedDate),
                        new WeightRecord(72.0, repeatedDate),
                        new WeightRecord(73.0, ClinicalTime.today().minusDays(1))
                ),
                70.0
        );

        assertEquals(2, normalizedHistory.size());
        assertEquals(72.0, normalizedHistory.get(0).weightKg());
        assertEquals(73.0, normalizedHistory.get(1).weightKg());
    }

    @Test
    void shouldRejectPostalCodeWithInvalidLength() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileFieldValidator.validatePostalCode("1234")
        );

        assertEquals("Postal code must contain exactly 5 digits.", exception.getMessage());
    }
}
