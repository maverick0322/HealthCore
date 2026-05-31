package com.healthcore.clinical.application.service.support;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ClinicAddressCatalogValidator {

    private final PostalCodeCatalogPort postalCodeCatalogPort;

    public ClinicAddressCatalogValidator(PostalCodeCatalogPort postalCodeCatalogPort) {
        this.postalCodeCatalogPort = postalCodeCatalogPort;
    }

    public void validate(ClinicAddress clinicAddress) {
        if (clinicAddress == null) {
            return;
        }

        if (!clinicAddress.isComplete()) {
            throw new IllegalArgumentException("Clinic address must be complete when provided.");
        }

        Optional<PostalCodeCatalogEntry> catalogEntry = postalCodeCatalogPort.findByPostalCode(clinicAddress.getPostalCode());
        if (catalogEntry.isPresent() && !catalogEntry.get().matches(clinicAddress)) {
            throw new IllegalArgumentException("Clinic address does not match the postal code catalog.");
        }
    }
}
