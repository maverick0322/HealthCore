package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.in.LookupPostalCodeUseCase;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PostalCodeReferenceApplicationService implements LookupPostalCodeUseCase {

    private final PostalCodeCatalogPort postalCodeCatalogPort;

    public PostalCodeReferenceApplicationService(PostalCodeCatalogPort postalCodeCatalogPort) {
        this.postalCodeCatalogPort = postalCodeCatalogPort;
    }

    @Override
    public Optional<PostalCodeCatalogEntry> lookupPostalCode(String postalCode) {
        return postalCodeCatalogPort.findByPostalCode(postalCode);
    }
}
