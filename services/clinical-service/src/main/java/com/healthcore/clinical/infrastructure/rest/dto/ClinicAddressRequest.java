package com.healthcore.clinical.infrastructure.rest.dto;

public record ClinicAddressRequest(
        String postalCode,
        String state,
        String city,
        String municipality,
        String neighborhood,
        String street,
        String exteriorNumber,
        String interiorNumber
) {
}
