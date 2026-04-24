package com.healthcore.agenda_service.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAppointmentRequest(
    @NotBlank String slotId,
    @NotNull Long slotVersion
) {
}

