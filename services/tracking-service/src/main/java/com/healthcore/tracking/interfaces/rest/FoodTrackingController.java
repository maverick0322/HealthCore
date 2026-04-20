package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
public class FoodTrackingController {

    private final FoodCatalogPort catalogPort;

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
    public ResponseEntity<Map<String, Object>> logFoodConsumption(@RequestBody Map<String, Object> payload) {
        log.info("Request received to log food consumption. Payload: {}", payload);

        String barcode = (String) payload.get("barcode");
        Number gramsNumber = (Number) payload.get("grams");
        double grams = gramsNumber != null ? gramsNumber.doubleValue() : 0.0;

        return catalogPort.getNutrientsByBarcode(barcode)
                .map(nutrients -> {
                    // Aquí en el futuro guardarás en la Base de Datos.
                    // Por ahora, solo calculamos los macros multiplicados por los gramos.
                    double multiplier = grams / 100.0;

                    return ResponseEntity.status(201).body(Map.of(
                            "status", "success",
                            "message", "Alimento procesado correctamente",
                            "original100g", nutrients,
                            "calculatedForGrams", Map.of(
                                    "grams", grams,
                                    "calories", nutrients.getCalories() * multiplier
                            )
                    ));
                })
                .orElseThrow(() -> new NotFoundException("El código de barras no existe en Open Food Facts"));
    }
}