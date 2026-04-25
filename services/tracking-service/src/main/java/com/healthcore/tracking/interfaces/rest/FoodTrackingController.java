package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.usecase.FoodTrackingUseCase;
import com.healthcore.tracking.domain.model.FoodLog;
import com.healthcore.tracking.domain.model.FoodNutrients;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Driving Adapter (REST Web).
 * Strictly handles HTTP routing, authentication extraction, and JSON serialization.
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

    @PostMapping("/logs/food")
    public ResponseEntity<FoodLog> logFoodConsumption(
            @RequestBody FoodLogRequest request,
            @AuthenticationPrincipal String userId) {

        log.info("REST request to log {}g of barcode {} for user {}", request.grams(), request.barcode(), userId);
        FoodLog savedLog = trackingUseCase.logFoodConsumption(userId, request.barcode(), request.grams());

        return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);
    }

    @GetMapping("/logs/today")
    public ResponseEntity<List<FoodLog>> getTodayLogs(@AuthenticationPrincipal String userId) {
        log.info("REST request to fetch today's logs for user: {}", userId);
        List<FoodLog> todayLogs = trackingUseCase.getTodayLogs(userId);
        return ResponseEntity.ok(todayLogs);
    }
}