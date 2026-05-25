package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.api.dto.ReportingSeedAppointmentAdjustRequest;
import com.healthcore.agenda_service.application.NutritionistAvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/agenda/nutritionist/dev")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "agenda.dev-tools", name = "enabled", havingValue = "true")
public class NutritionistAgendaDevController {

    private final NutritionistAvailabilityService nutritionistAvailabilityService;

    @PostMapping("/appointments/reporting-adjustments")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Integer> applyReportingSeedAdjustments(
        Authentication authentication,
        @Valid @RequestBody ReportingSeedAppointmentAdjustRequest request
    ) {
        String nutritionistId = currentNutritionistId(authentication);
        int updatedCount = nutritionistAvailabilityService.applyReportingSeedAdjustments(
            nutritionistId,
            request.appointments().stream()
                .map(appointment -> new NutritionistAvailabilityService.ReportingSeedAppointmentAdjustment(
                    appointment.appointmentId(),
                    appointment.startTime(),
                    appointment.endTime(),
                    appointment.status()
                ))
                .toList()
        );

        return Map.of("updatedCount", updatedCount);
    }

    private String currentNutritionistId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido o ausente");
        }
        return authentication.getName();
    }
}
