package com.healthcore.agenda_service.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RescheduleAppointmentRequest(
        @NotBlank String newSlotId,
        @NotNull Long newSlotVersion,
        String locale
) {
}
