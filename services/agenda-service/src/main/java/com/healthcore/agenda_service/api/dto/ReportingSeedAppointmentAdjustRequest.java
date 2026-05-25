package com.healthcore.agenda_service.api.dto;

import com.healthcore.agenda_service.domain.AppointmentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public record ReportingSeedAppointmentAdjustRequest(
    @NotEmpty List<@Valid AppointmentAdjustmentRequest> appointments
) {
    public record AppointmentAdjustmentRequest(
        @NotBlank String appointmentId,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        @NotNull AppointmentStatus status
    ) {
    }
}
