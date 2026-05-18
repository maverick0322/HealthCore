package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;

import java.util.Optional;

public interface PostalCodeCatalogPort {
    Optional<PostalCodeCatalogEntry> findByPostalCode(String postalCode);
}
