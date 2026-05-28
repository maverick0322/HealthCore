package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "PostalCodeLookupResponse", description = "Resolved SEPOMEX postal code information.")
public record PostalCodeLookupResponse(
        @Schema(description = "Postal code", example = "03100")
        String postalCode,
        @Schema(description = "State name", example = "Ciudad de Mexico")
        String state,
        @Schema(description = "City name", example = "Ciudad de Mexico")
        String city,
        @Schema(description = "Municipality or borough", example = "Benito Juarez")
        String municipality,
        @Schema(description = "Known neighborhoods or colonies for the postal code", example = "[\"Narvarte Oriente\",\"Narvarte Poniente\"]")
        List<String> colonies
) {
}
