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
}