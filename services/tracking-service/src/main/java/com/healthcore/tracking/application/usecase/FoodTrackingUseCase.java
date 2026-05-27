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
import com.healthcore.tracking.infrastructure.grpc.client.MediaGrpcClientAdapter;
import io.grpc.StatusRuntimeException;

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
    private final MealLogPort logPort;
    private final MediaGrpcClientAdapter mediaGrpcClient;

    private static final int MIN_SEARCH_QUERY_LENGTH = 3;
    private static final int MAX_MEALNAME_LENGTH = 30;

    public FoodNutrients getFoodFromCatalog(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new InvalidDomainDataException("Barcode cannot be null or empty.");
        }
        log.debug("Delegating catalog lookup. barcodeHash={}", logHash(barcode));
        return catalogPort.getNutrientsByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Barcode [" + barcode + "] not found in external catalog."));
    }

    public List<FoodNutrients> searchCatalog(String query) {
        if (query == null || query.trim().length() < MIN_SEARCH_QUERY_LENGTH) {
            throw new InvalidDomainDataException("Search query must contain at least 3 characters.");
        }
        log.debug("Delegating catalog search. queryHash={} queryLength={}", logHash(query), query.length());
        return catalogPort.searchFoodByName(query);
    }

    /**
     * Registers a complete meal by fetching necessary nutritional data and building the Aggregate.
     */
    public MealLog logMealConsumption(String userId, String mealName, MealType mealType, LocalDateTime consumedAt,
                                      String photoKey, List<MealItemCommand> requestedItems) {
        if (userId == null || userId.isBlank()) {
            throw new InvalidDomainDataException("User ID is required to log a meal.");
        }

        if (mealName == null || mealName.isBlank() || mealName.length() > MAX_MEALNAME_LENGTH) {
            throw new InvalidDomainDataException("Meal name is required and cannot exceed 60 characters.");
        }

        log.info("Processing meal consumption log. userHash={} mealName='{}' mealType={} itemCount={}",
                logHash(userId), mealName, mealType, requestedItems.size());

        List<MealItem> mealItems = requestedItems.stream()
                .map(item -> {
                    FoodNutrients baseNutrients = getFoodFromCatalog(item.barcode());
                    return MealItem.create(baseNutrients, item.grams());
                })
                .collect(Collectors.toList());

        MealLog newMealLog = MealLog.create(userId, mealName, mealType, consumedAt, photoKey, mealItems);

        return logPort.save(newMealLog);
    }

    /**
     * Retrieves meal logs for the current day.
     * Reuses getDailyLogs to maintain DRY principle.
     */
    public List<MealLog> getTodayLogs(String userId) {
        log.debug("Retrieving today's meal logs. userHash={}", logHash(userId));
        return getDailyLogs(userId, LocalDate.now());
    }

    /**
     * Retrieves meal logs for a specific historical date.
     * Enriches the response with secure pre-signed URLs for media files.
     */
    public List<MealLog> getDailyLogs(String userId, LocalDate date) {
        if (userId == null || userId.isBlank() || date == null) {
            throw new InvalidDomainDataException("User ID and date are required to fetch daily logs.");
        }
        log.debug("Retrieving meal logs. userHash={} date={}", logHash(userId), date);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<MealLog> rawLogs = logPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);

        return rawLogs.stream().map(meal -> {
            if (meal.getPhotoKey() != null && !meal.getPhotoKey().isBlank()) {
                try {
                    String presignedReadUrl = mediaGrpcClient.getPresignedReadUrl(meal.getPhotoKey());

                    return meal.toBuilder()
                            .photoKey(presignedReadUrl)
                            .build();

                } catch (StatusRuntimeException grpcEx) {
                    log.error("gRPC failure while generating secure read URL for photoKey: {}. Status: {}",
                            meal.getPhotoKey(), grpcEx.getStatus().getCode());
                } catch (IllegalArgumentException iae) {
                    log.warn("Invalid photo key format provided to media service: {}", meal.getPhotoKey());
                } catch (Exception e) {
                    log.error("Unexpected error generating URL for photoKey: {}. Error: {}",
                            meal.getPhotoKey(), e.getMessage());
                }
            }
            return meal;
        }).collect(Collectors.toList());
    }

    /**
     * Inner record acting as a Command Payload.
     * Ensures the Use Case remains completely decoupled from REST/Web dependencies.
     */
    public record MealItemCommand(String barcode, double grams) {}

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}