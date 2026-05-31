package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ClinicalObservationDocumentTest {

    @Test
    void shouldCreateObservationDocumentWithConstructorValues() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 30, 12, 0);

        ClinicalObservationDocument document = new ClinicalObservationDocument(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Initial note",
                createdAt
        );

        assertEquals("obs-1", document.getId());
        assertEquals("patient-1", document.getPatientId());
        assertEquals("nutri-1", document.getNutritionistId());
        assertEquals("Initial note", document.getNote());
        assertEquals(createdAt, document.getCreatedAt());
    }

    @Test
    void shouldAllowObservationDocumentMutationThroughSetters() {
        ClinicalObservationDocument document = new ClinicalObservationDocument();
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 31, 9, 0);

        assertNull(document.getId());
        document.setId("obs-2");
        document.setPatientId("patient-2");
        document.setNutritionistId("nutri-2");
        document.setNote("Updated note");
        document.setCreatedAt(createdAt);

        assertEquals("obs-2", document.getId());
        assertEquals("patient-2", document.getPatientId());
        assertEquals("nutri-2", document.getNutritionistId());
        assertEquals("Updated note", document.getNote());
        assertEquals(createdAt, document.getCreatedAt());
    }
}
