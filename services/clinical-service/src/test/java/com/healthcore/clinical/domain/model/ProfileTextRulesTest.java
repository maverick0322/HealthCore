package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileTextRulesTest {

    @Test
    void shouldNormalizeRequiredUserId() {
        assertEquals("user-123", ProfileTextRules.requireUserId("  user-123  "));
    }

    @Test
    void shouldRejectEmptyUserId() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileTextRules.requireUserId("   ")
        );

        assertEquals("User ID cannot be null or empty.", exception.getMessage());
    }

    @Test
    void shouldRejectNameWithInvalidCharacters() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileTextRules.validateRequiredName("Carlos1", "First name")
        );

        assertEquals("First name must contain only letters, spaces, apostrophes, or hyphens.", exception.getMessage());
    }

    @Test
    void shouldAllowOptionalAllowedValueToBeMissing() {
        assertNull(ProfileTextRules.validateAllowedValue(null, Set.of("omnivore", "vegan"), false, "Diet type"));
    }

    @Test
    void shouldRejectValueOutsideAllowedSet() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileTextRules.validateAllowedValue("keto", Set.of("omnivore", "vegan"), true, "Diet type")
        );

        assertEquals("Diet type is invalid.", exception.getMessage());
    }

    @Test
    void shouldNormalizeAndDeduplicateAllowedValueList() {
        List<String> normalized = ProfileTextRules.normalizeAndValidateList(
                List.of(" gluten ", "lactose", "gluten", " "),
                Set.of("gluten", "lactose", "nuts"),
                5,
                20,
                "Allergy"
        );

        assertEquals(List.of("gluten", "lactose"), normalized);
    }

    @Test
    void shouldRejectAllowedValueListWithTooManyItems() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProfileTextRules.normalizeAndValidateList(
                        List.of("gluten", "lactose", "nuts"),
                        Set.of("gluten", "lactose", "nuts"),
                        2,
                        20,
                        "Allergy"
                )
        );

        assertEquals("Allergy exceeds the maximum number of allowed values.", exception.getMessage());
    }

    @Test
    void shouldNormalizeAndDeduplicateFreeTextList() {
        List<String> normalized = ProfileTextRules.normalizeAndValidateFreeTextList(
                List.of("  Pan dulce  ", "Avena", "Pan dulce", " "),
                15,
                40,
                "Excluded food"
        );

        assertEquals(List.of("Pan dulce", "Avena"), normalized);
    }
}
