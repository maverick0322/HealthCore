package com.healthcore.clinical.application.service.support;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClinicAddressCatalogValidatorTest {

    private final PostalCodeCatalogPort postalCodeCatalogPort = mock(PostalCodeCatalogPort.class);
    private final ClinicAddressCatalogValidator validator = new ClinicAddressCatalogValidator(postalCodeCatalogPort);

    @Test
    void shouldAllowManualClinicAddressWhenPostalCodeIsUnknown() {
        ClinicAddress clinicAddress = new ClinicAddress(
                "99999",
                "Estado Manual",
                "Ciudad Manual",
                "Municipio Manual",
                "Colonia Manual",
                "Calle Uno",
                "123",
                null
        );
        when(postalCodeCatalogPort.findByPostalCode("99999")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> validator.validate(clinicAddress));
    }

    @Test
    void shouldRejectIncompleteClinicAddress() {
        ClinicAddress clinicAddress = ClinicAddress.rehydrate(
                "03100",
                "Ciudad de Mexico",
                null,
                "Benito Juarez",
                "Narvarte Oriente",
                "Xola",
                "123",
                null
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validate(clinicAddress)
        );

        assertEquals("Clinic address must be complete when provided.", exception.getMessage());
        verify(postalCodeCatalogPort, never()).findByPostalCode("03100");
    }

    @Test
    void shouldRejectClinicAddressThatDoesNotMatchCatalogEntry() {
        ClinicAddress clinicAddress = new ClinicAddress(
                "03100",
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                "Colonia Invalida",
                "Xola",
                "123",
                null
        );
        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(
                new PostalCodeCatalogEntry(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        List.of("Narvarte Oriente", "Narvarte Poniente")
                )
        ));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validate(clinicAddress)
        );

        assertEquals("Clinic address does not match the postal code catalog.", exception.getMessage());
    }
}
