package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.port.MealLogPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Primary Application Service (Use Case).
 * Orchestrates business workflows by coordinating Domain models and Outbound Ports.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FoodTrackingUseCase {

    private final FoodCatalogPort catalogPort;
    private final MealLogPort logPort; // Note: You'll need to rename FoodLogPort to MealLogPort

    private static final int MIN_SEARCH_QUERY_LENGTH = 3;

    public FoodNutrients getFoodFromCatalog(String barcode) {
        log.debug("Delegating catalog lookup for barcode: {}", barcode);
        return catalogPort.getNutrientsByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Barcode [" + barcode + "] not found in external catalog."));
    }

    public List<FoodNutrients> searchCatalog(String query) {
        if (query == null || query.trim().length() < MIN_SEARCH_QUERY_LENGTH) {
            throw new InvalidDomainDataException("Search query must contain at least 3 characters.");
        }
        log.debug("Delegating catalog search for query: {}", query);
        return catalogPort.searchFoodByName(query);
    }

    /**
     * Registers a complete meal by fetching necessary nutritional data and building the Aggregate.
     */
    public MealLog logMealConsumption(String userId, MealType mealType, LocalDateTime consumedAt, String photoKey, List<MealItemCommand> requestedItems) {
        log.info("Processing meal consumption log for user: {}, mealType: {}, items count: {}", userId, mealType, requestedItems.size());

        // 1. Fetch nutrients and build MealItems (Children Entities)
        // Note: Using stream to maintain immutability and functional purity
        List<MealItem> mealItems = requestedItems.stream()
                .map(item -> {
                    FoodNutrients baseNutrients = getFoodFromCatalog(item.barcode());
                    return MealItem.create(baseNutrients, item.grams());
                })
                .collect(Collectors.toList());

        // 2. Build the Aggregate Root
        MealLog newMealLog = MealLog.create(userId, mealType, consumedAt, photoKey, mealItems);

        // 3. Persist the Aggregate
        return logPort.save(newMealLog);
    }

    public List<MealLog> getTodayLogs(String userId) {
        log.debug("Retrieving today's meal logs for user: {}", userId);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return logPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);
    }

    /**
     * Inner record acting as a Command Payload.
     * Ensures the Use Case remains completely decoupled from REST/Web dependencies.
     */
    public record MealItemCommand(String barcode, double grams) {}
}