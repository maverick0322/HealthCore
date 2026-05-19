package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;

import java.util.Optional;

public interface LookupPostalCodeUseCase {
    Optional<PostalCodeCatalogEntry> lookupPostalCode(String postalCode);
}
