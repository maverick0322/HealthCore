package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PostalCodeCatalogEntryTest {

    @Test
    void shouldMatchCompleteClinicAddressUsingNormalizedValues() {
        PostalCodeCatalogEntry entry = new PostalCodeCatalogEntry(
                "03100",
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                List.of("Narvarte Poniente", "Del Valle")
        );

        ClinicAddress address = new ClinicAddress(
                "03100",
                " ciudad de mexico ",
                " ciudad de mexico ",
                " benito juarez ",
                " narvarte poniente ",
                "Avenida Universidad",
                "100",
                null
        );

        assertTrue(entry.matches(address));
    }

    @Test
    void shouldNotMatchIncompleteClinicAddress() {
        PostalCodeCatalogEntry entry = new PostalCodeCatalogEntry(
                "03100",
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                List.of("Narvarte Poniente")
        );
        ClinicAddress address = ClinicAddress.rehydrate(
                "03100",
                "Ciudad de Mexico",
                null,
                "Benito Juarez",
                "Narvarte Poniente",
                "Avenida Universidad",
                "100",
                null
        );

        assertFalse(entry.matches(address));
    }

    @Test
    void shouldDeduplicateColoniesPreservingOrder() {
        PostalCodeCatalogEntry entry = new PostalCodeCatalogEntry(
                "03100",
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                List.of("Narvarte Poniente", "Narvarte Poniente", "Del Valle")
        );

        assertEquals(List.of("Narvarte Poniente", "Del Valle"), entry.colonies());
    }

    @Test
    void shouldRejectCatalogEntryWithoutColonies() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PostalCodeCatalogEntry(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        List.of()
                )
        );

        assertEquals("Colonies are required.", exception.getMessage());
    }
}
