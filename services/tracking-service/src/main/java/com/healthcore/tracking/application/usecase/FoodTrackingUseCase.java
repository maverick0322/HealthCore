package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodLog;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.port.FoodLogPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Primary Application Service (Use Case).
 * Orchestrates business workflows by coordinating Domain models and Outbound Ports.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FoodTrackingUseCase {

    private final FoodCatalogPort catalogPort;
    private final FoodLogPort logPort;
    private final int MIN_SEARCH_QUERY_LENGTH = 3;

    public FoodNutrients getFoodFromCatalog(String barcode) {
        log.debug("Delegating catalog lookup for barcode: {}", barcode);
        return catalogPort.getNutrientsByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Barcode [" + barcode + "] not found in external " +
                        "catalog."));
    }

    public List<FoodNutrients> searchCatalog(String query) {
        if (query == null || query.trim().length() < MIN_SEARCH_QUERY_LENGTH) {
            throw new InvalidDomainDataException("Search query must contain at least 3 characters.");
        }
        log.debug("Delegating catalog search for query: {}", query);
        return catalogPort.searchFoodByName(query);
    }

    public FoodLog logFoodConsumption(String userId, String barcode, double consumedGrams) {
        log.info("Processing food consumption log for user: {}, barcode: {}", userId, barcode);

        FoodNutrients baseNutrients = getFoodFromCatalog(barcode);
        FoodLog newLog = FoodLog.create(userId, baseNutrients, consumedGrams, LocalDateTime.now());

        return logPort.save(newLog);
    }

    public List<FoodLog> getTodayLogs(String userId) {
        log.debug("Retrieving today's food logs for user: {}", userId);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return logPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);
    }
}