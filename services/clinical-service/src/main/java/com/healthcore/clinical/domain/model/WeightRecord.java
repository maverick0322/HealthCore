package com.healthcore.clinical.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(name = "WeightRecord", description = "Single historical weight entry for a patient.")
public record WeightRecord(
        @Schema(description = "Recorded patient weight in kilograms", example = "72.5")
        Double weightKg,
        @Schema(description = "Date associated with the weight record", example = "2026-05-27")
        LocalDate date
) {
}
