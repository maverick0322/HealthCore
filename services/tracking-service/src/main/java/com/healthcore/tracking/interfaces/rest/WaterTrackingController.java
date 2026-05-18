package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.usecase.WaterTrackingUseCase;
import com.healthcore.tracking.domain.model.WaterLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Driving Adapter (REST Web).
 * Strictly handles HTTP routing, authentication extraction, validation, and JSON serialization for Water consumption.
 * Contains ZERO business logic.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tracking/logs/water")
@RequiredArgsConstructor
@Tag(name = "Water Tracking", description = "Endpoints para el registro de consumo de agua.")
public class WaterTrackingController {

    private final WaterTrackingUseCase waterUseCase;

    @PostMapping
    @Operation(
            summary = "Registrar consumo de agua",
            description = "Guarda un registro de la cantidad de agua consumida en mililitros.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<WaterLog> logWaterConsumption(
            @Valid @RequestBody WaterLogRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal String userId) {

        log.info("REST request to log {} ml of water for user {}", request.amountMl(), userId);

        WaterLog savedLog = waterUseCase.logWaterConsumption(
                userId,
                request.amountMl(),
                request.consumedAt()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);
    }
}