package com.healthcore.clinical.infrastructure.reference.sepomex;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
        assertEquals("Benito Ju\u00e1rez", entry.get().municipality());
        assertTrue(!entry.get().colonies().isEmpty());
    }
}
