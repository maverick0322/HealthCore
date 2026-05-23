package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.application.usecase.DashboardSummaryUseCase;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Driving Adapter (REST).
 * Segregated controller specifically for querying aggregated UI dashboard data (CQRS Read-Side).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tracking/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints de solo lectura para métricas y gráficas del usuario.")
public class DashboardController {

    private final DashboardSummaryUseCase dashboardUseCase;

    @GetMapping("/today")
    @Operation(summary = "Resumen del día actual", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<TodayDashboardSummary> getTodaySummary(
            @AuthenticationPrincipal String userId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        log.info("REST request for today's dashboard summary. userHash={} date={}", logHash(userId), targetDate);

        return ResponseEntity.ok(dashboardUseCase.getTodaySummary(userId, targetDate));
    }

    @GetMapping("/history")
    @Operation(summary = "Histórico de macros", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<List<DailyMacroSummary>> getHistoricalMacros(
            @AuthenticationPrincipal String userId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("REST request for historical macros. userHash={} start={} end={}", logHash(userId), startDate, endDate);
        return ResponseEntity.ok(dashboardUseCase.getHistoricalMacros(userId, startDate, endDate));
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
