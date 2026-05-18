package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record PostalCodeLookupResponse(
        String postalCode,
        String state,
        String city,
        String municipality,
        List<String> colonies
) {
}
