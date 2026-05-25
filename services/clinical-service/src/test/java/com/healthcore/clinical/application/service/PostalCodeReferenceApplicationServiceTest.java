package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostalCodeReferenceApplicationServiceTest {

    @Mock
    private PostalCodeCatalogPort postalCodeCatalogPort;

    @InjectMocks
    private PostalCodeReferenceApplicationService service;

    @Test
    void shouldReturnPostalCodeCatalogEntryWhenPostalCodeExists() {
        PostalCodeCatalogEntry entry = new PostalCodeCatalogEntry(
                "91000",
                "Veracruz",
                "Xalapa",
                "Xalapa",
                List.of("Centro")
        );
        when(postalCodeCatalogPort.findByPostalCode("91000")).thenReturn(Optional.of(entry));

        Optional<PostalCodeCatalogEntry> result = service.lookupPostalCode("91000");

        assertTrue(result.isPresent());
        assertEquals("91000", result.get().postalCode());
        verify(postalCodeCatalogPort).findByPostalCode("91000");
    }

    @Test
    void shouldReturnEmptyWhenPostalCodeDoesNotExist() {
        when(postalCodeCatalogPort.findByPostalCode("99999")).thenReturn(Optional.empty());

        Optional<PostalCodeCatalogEntry> result = service.lookupPostalCode("99999");

        assertTrue(result.isEmpty());
        verify(postalCodeCatalogPort).findByPostalCode("99999");
    }
}
