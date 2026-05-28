package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ClinicAddressResponse", description = "Resolved clinic address returned in a nutritionist profile.")
public record ClinicAddressResponse(
        @Schema(description = "Postal code", example = "03100")
        String postalCode,
        @Schema(description = "State name", example = "Ciudad de Mexico")
        String state,
        @Schema(description = "City name", example = "Ciudad de Mexico")
        String city,
        @Schema(description = "Municipality or borough", example = "Benito Juarez")
        String municipality,
        @Schema(description = "Neighborhood", example = "Narvarte Oriente")
        String neighborhood,
        @Schema(description = "Street name", example = "Xola")
        String street,
        @Schema(description = "Exterior number", example = "123")
        String exteriorNumber,
        @Schema(description = "Interior number", example = "4B")
        String interiorNumber
) {
}
