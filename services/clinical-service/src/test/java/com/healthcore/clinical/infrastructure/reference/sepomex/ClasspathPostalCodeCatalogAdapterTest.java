package com.healthcore.clinical.infrastructure.reference.sepomex;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import static org.junit.jupiter.api.Assertions.*;

class ClasspathPostalCodeCatalogAdapterTest {

    @Test
    void shouldLoadSnapshotAndFindPostalCode() {
        ClasspathPostalCodeCatalogAdapter adapter = new ClasspathPostalCodeCatalogAdapter(
                new ObjectMapper(),
                new DefaultResourceLoader()
        );
        adapter.loadSnapshot();

        var entry = adapter.findByPostalCode("03100");

        assertTrue(entry.isPresent());
        assertEquals("Benito Juárez", entry.get().municipality());
        assertTrue(entry.get().colonies().contains("Narvarte Oriente"));
    }
}
