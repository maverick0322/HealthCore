package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.usecase.FoodTrackingUseCase;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealLog;
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
public class FoodTrackingController {

    private final FoodTrackingUseCase trackingUseCase;

    @GetMapping("/catalog/{barcode}")
    public ResponseEntity<FoodNutrients> getFoodFromCatalog(@PathVariable String barcode) {
        log.info("REST request to fetch catalog details for barcode: {}", barcode);
        FoodNutrients nutrients = trackingUseCase.getFoodFromCatalog(barcode);
        return ResponseEntity.ok(nutrients);
    }

    @GetMapping("/catalog/search")
    public ResponseEntity<List<FoodNutrients>> searchCatalog(@RequestParam("query") String query) {
        log.info("REST request to search catalog for query: {}", query);
        List<FoodNutrients> results = trackingUseCase.searchCatalog(query);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/logs/meal")
    public ResponseEntity<MealLog> logMealConsumption(
            @Valid @RequestBody MealLogRequest request,
            @AuthenticationPrincipal String userId) {

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
    public ResponseEntity<List<MealLog>> getTodayLogs(@AuthenticationPrincipal String userId) {
        log.info("REST request to fetch today's meal logs for user: {}", userId);
        List<MealLog> todayLogs = trackingUseCase.getTodayLogs(userId);
        return ResponseEntity.ok(todayLogs);
    }
}