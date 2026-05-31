package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClinicAddressTest {

    @Test
    void shouldCreateClinicAddressWhenValuesAreValid() {
        ClinicAddress address = new ClinicAddress(
                "03100",
                " Ciudad de Mexico ",
                " Benito Juarez ",
                " Benito Juarez ",
                " Narvarte Poniente ",
                " Avenida Universidad ",
                " 100 ",
                " 3B "
        );

        assertEquals("03100", address.getPostalCode());
        assertEquals("Ciudad de Mexico", address.getState());
        assertEquals("Benito Juarez", address.getCity());
        assertEquals("Benito Juarez", address.getMunicipality());
        assertEquals("Narvarte Poniente", address.getNeighborhood());
        assertEquals("Avenida Universidad", address.getStreet());
        assertEquals("100", address.getExteriorNumber());
        assertEquals("3B", address.getInteriorNumber());
        assertTrue(address.isComplete());
    }

    @Test
    void shouldReturnNullWhenRehydratingEmptyAddress() {
        ClinicAddress address = ClinicAddress.rehydrate(null, " ", null, "", null, null, null, null);

        assertNull(address);
    }

    @Test
    void shouldRehydratePartialAddressAndMarkItAsIncomplete() {
        ClinicAddress address = ClinicAddress.rehydrate(
                "03100",
                " Ciudad de Mexico ",
                null,
                " Benito Juarez ",
                " Narvarte Poniente ",
                " Avenida Universidad ",
                " 100 ",
                null
        );

        assertNotNull(address);
        assertEquals("03100", address.getPostalCode());
        assertEquals("Ciudad de Mexico", address.getState());
        assertNull(address.getCity());
        assertFalse(address.isComplete());
    }

    @Test
    void shouldRejectInvalidPostalCode() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new ClinicAddress(
                        "3100",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Benito Juarez",
                        "Narvarte Poniente",
                        "Avenida Universidad",
                        "100",
                        null
                )
        );

        assertEquals("Postal code must contain exactly 5 digits.", exception.getMessage());
    }
}
