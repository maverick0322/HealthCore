package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClinicalObservationTest {

    @Test
    void shouldCreateClinicalObservationWithConstructorValues() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 30, 12, 0);

        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Initial note",
                createdAt
        );

        assertEquals("obs-1", observation.getId());
        assertEquals("patient-1", observation.getPatientId());
        assertEquals("nutri-1", observation.getNutritionistId());
        assertEquals("Initial note", observation.getNote());
        assertEquals(createdAt, observation.getCreatedAt());
    }

    @Test
    void shouldUpdateClinicalObservationFieldsThroughSetters() {
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Initial note",
                LocalDateTime.of(2026, 5, 30, 12, 0)
        );
        LocalDateTime updatedAt = LocalDateTime.of(2026, 5, 31, 8, 30);

        observation.setId("obs-2");
        observation.setPatientId("patient-2");
        observation.setNutritionistId("nutri-2");
        observation.setNote("Updated note");
        observation.setCreatedAt(updatedAt);

        assertEquals("obs-2", observation.getId());
        assertEquals("patient-2", observation.getPatientId());
        assertEquals("nutri-2", observation.getNutritionistId());
        assertEquals("Updated note", observation.getNote());
        assertEquals(updatedAt, observation.getCreatedAt());
    }
}
