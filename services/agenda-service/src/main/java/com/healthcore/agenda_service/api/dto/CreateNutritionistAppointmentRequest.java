package com.healthcore.agenda_service.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNutritionistAppointmentRequest(
    @NotBlank String slotId,
    @NotNull Long slotVersion,
    @NotBlank String patientId,
    String locale
) {
}
