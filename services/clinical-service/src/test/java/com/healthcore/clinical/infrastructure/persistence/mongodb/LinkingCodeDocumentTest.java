package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LinkingCodeDocumentTest {

    @Test
    void shouldCreateLinkingCodeDocumentWithConstructorValues() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 30, 12, 0);

        LinkingCodeDocument document = new LinkingCodeDocument("ABC123", "nutri-1", createdAt);

        assertEquals("ABC123", document.getCode());
        assertEquals("nutri-1", document.getNutritionistId());
        assertEquals(createdAt, document.getCreatedAt());
    }

    @Test
    void shouldAllowLinkingCodeDocumentMutationThroughSetters() {
        LinkingCodeDocument document = new LinkingCodeDocument();
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 31, 9, 0);

        assertNull(document.getCode());
        document.setCode("XYZ789");
        document.setNutritionistId("nutri-2");
        document.setCreatedAt(createdAt);

        assertEquals("XYZ789", document.getCode());
        assertEquals("nutri-2", document.getNutritionistId());
        assertEquals(createdAt, document.getCreatedAt());
    }
}
