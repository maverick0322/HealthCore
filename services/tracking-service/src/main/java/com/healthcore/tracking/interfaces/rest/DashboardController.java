package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.application.usecase.DashboardSummaryUseCase;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.infrastructure.grpc.client.GrpcClinicalServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Driving Adapter (REST).
 * Segregated controller specifically for querying aggregated UI dashboard data (CQRS Read-Side).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints de solo lectura para métricas y gráficas del usuario.")
public class DashboardController {

    private final DashboardSummaryUseCase dashboardUseCase;
    private final GrpcClinicalServiceClient clinicalServiceClient;

    @GetMapping("/dashboard/today")
    @Operation(summary = "Resumen del día actual", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<TodayDashboardSummary> getTodaySummary(
            @AuthenticationPrincipal String userId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        log.info("REST request for today's dashboard summary. userHash={} date={}", logHash(userId), targetDate);

        return ResponseEntity.ok(dashboardUseCase.getTodaySummary(userId, targetDate));
    }

    @GetMapping("/dashboard/history")
    @Operation(summary = "Histórico de macros", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<List<DailyMacroSummary>> getHistoricalMacros(
            @AuthenticationPrincipal String userId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("REST request for historical macros. userHash={} start={} end={}", logHash(userId), startDate, endDate);
        return ResponseEntity.ok(dashboardUseCase.getHistoricalMacros(userId, startDate, endDate));
    }

    @GetMapping("/nutritionist/patients/{patientId}/dashboard/today")
    @Operation(summary = "Resumen del paciente vinculado", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<TodayDashboardSummary> getNutritionistPatientTodaySummary(
            @AuthenticationPrincipal String nutritionistId,
            Authentication authentication,
            @PathVariable String patientId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        requireNutritionistRole(authentication);
        validateNutritionistPatientLink(patientId, nutritionistId);

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        log.info("REST request for linked patient dashboard summary. patientHash={} nutritionistHash={} date={}",
                logHash(patientId), logHash(nutritionistId), targetDate);

        return ResponseEntity.ok(dashboardUseCase.getTodaySummary(patientId, targetDate));
    }

    @GetMapping("/nutritionist/patients/{patientId}/dashboard/history")
    @Operation(summary = "Histórico de macros del paciente vinculado", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<List<DailyMacroSummary>> getNutritionistPatientHistoricalMacros(
            @AuthenticationPrincipal String nutritionistId,
            Authentication authentication,
            @PathVariable String patientId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        requireNutritionistRole(authentication);
        validateNutritionistPatientLink(patientId, nutritionistId);

        log.info("REST request for linked patient historical macros. patientHash={} nutritionistHash={} start={} end={}",
                logHash(patientId), logHash(nutritionistId), startDate, endDate);

        return ResponseEntity.ok(dashboardUseCase.getHistoricalMacros(patientId, startDate, endDate));
    }

    private void requireNutritionistRole(Authentication authentication) {
        boolean hasNutritionistRole = authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_NUTRITIONIST".equals(authority.getAuthority()));
        if (!hasNutritionistRole) {
            throw new AccessDeniedException("Only nutritionists can access linked patient tracking data.");
        }
    }

    private void validateNutritionistPatientLink(String patientId, String nutritionistId) {
        if (!clinicalServiceClient.validateLink(patientId, nutritionistId)) {
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
