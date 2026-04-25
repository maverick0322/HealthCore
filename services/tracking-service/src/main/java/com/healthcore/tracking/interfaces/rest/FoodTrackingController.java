package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.exception.NotFoundException;
import com.healthcore.tracking.domain.model.FoodLog;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.infrastructure.persistence.FoodLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
public class FoodTrackingController {

    private final FoodCatalogPort catalogPort;
    private final FoodLogRepository repository;
    private final double portionSize = 100.0; // Standard portion size in grams

    @GetMapping("/catalog/{barcode}")
    public ResponseEntity<Map<String, Object>> getFoodFromCatalog(@PathVariable String barcode) {
        log.info("Request received to check food catalog for barcode: {}", barcode);

        return catalogPort.getNutrientsByBarcode(barcode)
                .map(nutrients -> ResponseEntity.ok(Map.of(
                        "status", "success",
                        "data", nutrients
                )))
                .orElseThrow(() -> new NotFoundException("Food item not found in catalog"));
    }

    @PostMapping("/logs/food")
    public ResponseEntity<Map<String, Object>> logFoodConsumption(
            @RequestBody FoodLogRequest request,
            @AuthenticationPrincipal String userId) {

        log.info("Usuario {} registrando {} gramos del producto {}", userId, request.getGrams(), request.getBarcode());

        return catalogPort.getNutrientsByBarcode(request.getBarcode())
                .map(nutrients -> {
                    double multiplier = request.getGrams() / portionSize;

                    FoodLog logEntry = FoodLog.builder()
                            .userId(userId)
                            .barcode(request.getBarcode())
                            .foodName(nutrients.getName())
                            .consumedGrams(request.getGrams())
                            .totalCalories(nutrients.getCalories() * multiplier)
                            .totalProteins(nutrients.getProteins() * multiplier)
                            .totalCarbs(nutrients.getCarbohydrates() * multiplier)
                            .totalFats(nutrients.getFats() * multiplier)
                            .consumedAt(LocalDateTime.now())
                            .build();

                    repository.save(logEntry);

                    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                            "status", "success",
                            "message", "Alimento procesado y guardado correctamente",
                            "data", logEntry
                    ));
                })
                .orElseThrow(() -> new NotFoundException("El código de barras no existe en el catálogo externo."));
    }

    @GetMapping("/logs/today")
    public ResponseEntity<List<FoodLog>> getTodayLogs(@AuthenticationPrincipal String userId) {
        log.info("Consultando historial de hoy para el usuario {}", userId);

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        List<FoodLog> todayLogs = repository.findByUserIdAndConsumedAtBetween(userId, startOfDay, endOfDay);

        return ResponseEntity.ok(todayLogs);
    }

    @GetMapping("/catalog/search")
    public ResponseEntity<List<FoodNutrients>> searchCatalog(@RequestParam("query") String query) {
        log.info("Request received to search catalog with query: {}", query);
        
        if (query == null || query.trim().length() < 3) {
            return ResponseEntity.badRequest().build();
        }

        List<FoodNutrients> results = catalogPort.searchFoodByName(query);
        return ResponseEntity.ok(results);
    }
}