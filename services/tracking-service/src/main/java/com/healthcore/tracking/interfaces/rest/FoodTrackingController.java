package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.usecase.FoodTrackingUseCase;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealLog;
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

import java.util.List;
import java.util.stream.Collectors;

/**
 * Driving Adapter (REST Web).
 * Strictly handles HTTP routing, authentication extraction, validation, and JSON serialization.
 * Contains ZERO business logic.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Tracking & Catalog", description = "Endpoints para la búsqueda de alimentos y registro de consumos diarios.")
public class FoodTrackingController {

    private final FoodTrackingUseCase trackingUseCase;

    @GetMapping("/catalog/{barcode}")
    @Operation(
            summary = "Buscar alimento por código de barras",
            description = "Consulta la información nutricional detallada de un alimento utilizando su código de barras. Busca primero en caché local y luego en FatSecret.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<FoodNutrients> getFoodFromCatalog(
            @Parameter(description = "Código de barras del producto (EAN/UPC)", example = "7622300336738")
            @PathVariable String barcode) {

        log.info("REST request to fetch catalog details for barcode: {}", barcode);
        FoodNutrients nutrients = trackingUseCase.getFoodFromCatalog(barcode);
        return ResponseEntity.ok(nutrients);
    }

    @GetMapping("/catalog/search")
    @Operation(
            summary = "Búsqueda de texto libre en el catálogo",
            description = "Busca una lista de alimentos que coincidan con la palabra clave proporcionada.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<List<FoodNutrients>> searchCatalog(
            @Parameter(description = "Nombre o palabra clave del alimento", example = "manzana")
            @RequestParam("query") String query) {

        log.info("REST request to search catalog for query: {}", query);
        List<FoodNutrients> results = trackingUseCase.searchCatalog(query);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/logs/meal")
    @Operation(
            summary = "Registrar un nuevo consumo",
            description = "Guarda un registro de los alimentos consumidos en una comida específica (desayuno, comida, cena, etc.)",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<MealLog> logMealConsumption(
            @Valid @RequestBody MealLogRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal String userId) {

        log.info("REST request to log meal type {} with {} items for user {}",
                request.mealType(), request.foods().size(), userId);

        List<FoodTrackingUseCase.MealItemCommand> commandItems = request.foods().stream()
                .map(item -> new FoodTrackingUseCase.MealItemCommand(item.barcode(), item.grams()))
                .collect(Collectors.toList());

        MealLog savedLog = trackingUseCase.logMealConsumption(
                userId,
                request.mealType(),
                request.consumedAt(),
                request.photoKey(),
                commandItems
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);
    }

    @GetMapping("/logs/today")
    @Operation(
            summary = "Obtener los consumos de hoy",
            description = "Devuelve la lista de todos los registros de comidas que el usuario autenticado ha guardado en el día actual.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<List<MealLog>> getTodayLogs(
            @Parameter(hidden = true) @AuthenticationPrincipal String userId) {

        log.info("REST request to fetch today's meal logs for user: {}", userId);
        List<MealLog> todayLogs = trackingUseCase.getTodayLogs(userId);
        return ResponseEntity.ok(todayLogs);
    }
}