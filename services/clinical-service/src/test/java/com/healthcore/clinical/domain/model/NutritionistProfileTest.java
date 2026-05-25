package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NutritionistProfileTest {

    @Test
    void shouldBuildCompletedNutritionistProfile() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-123",
                "Daniela",
                "Lopez",
                "Mora",
                List.of("CLINICAL", "OTHER"),
                "Nutricion funcional",
                "12345678",
                List.of("ONLINE", "PRESENTIAL"),
                "5512345678",
                null,
                "Especialista en nutricion clinica"
        );

        assertTrue(profile.isProfileCompleted());
        assertEquals("Daniela Lopez Mora", profile.getFullName());
        assertEquals(List.of("CLINICAL", "OTHER"), profile.getSpecializations());
    }

    @Test
    void shouldRequireCustomSpecializationWhenOtherIsSelected() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new NutritionistProfile(
                        "nutri-123",
                        "Daniela",
                        "Lopez",
                        null,
                        List.of("OTHER"),
                        null,
                        "12345678",
                        List.of("ONLINE"),
                        null,
                        null,
                        "Especialista en nutricion clinica"
                )
        );

        assertEquals("Custom specialization is required when OTHER is selected.", exception.getMessage());
    }

    @Test
    void shouldAllowRehydratedIncompleteProfile() {
        NutritionistProfile profile = NutritionistProfile.rehydrate(
                "nutri-123",
                "Daniela",
                null,
                null,
                List.of(),
                null,
                null,
                List.of(),
                null,
                null,
                null
        );

        assertFalse(profile.isProfileCompleted());
        assertEquals("Daniela", profile.getFullName());
        assertNull(profile.getProfessionalLicense());
    }

    @Test
    void shouldUpdateProfileWithNormalizedValues() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-123",
                "Daniela",
                "Lopez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("ONLINE"),
                null,
                null,
                "Especialista en nutricion clinica"
        );

        profile.updateProfile(
                "  Daniela   ",
                "  Lopez  ",
                " Mora ",
                List.of("SPORTS"),
                null,
                "1234567890",
                List.of("PRESENTIAL"),
                "5512345678",
                null,
                "Bio actualizada"
        );

        assertEquals("Daniela Lopez Mora", profile.getFullName());
        assertEquals(List.of("SPORTS"), profile.getSpecializations());
        assertEquals("5512345678", profile.getPhone());
    }
}
