package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.infrastructure.persistence.entity.MealItemDocument;
import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoMealLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Driven Adapter (Infrastructure): Isolates the core domain from MongoDB specifics.
 * Translates between the Domain Aggregate Root and the MongoDB Document.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MealLogPersistenceAdapter implements MealLogPort {

    private final SpringDataMongoMealLogRepository repository;

    @Override
    public MealLog save(MealLog mealLog) {
        log.debug("Saving MealLog to MongoDB for user: {}", mealLog.getUserId());
        MealLogDocument document = toDocument(mealLog);
        MealLogDocument savedDocument = repository.save(document);
        return toDomain(savedDocument);
    }

    @Override
    public List<MealLog> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end) {
        log.debug("Querying MongoDB for MealLogs by user and date range.");
        return repository.findByUserIdAndConsumedAtBetween(userId, start, end).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    // --- Mappers: Domain to Document ---

    private MealLogDocument toDocument(MealLog domain) {
        List<MealItemDocument> itemDocuments = domain.getItems().stream()
                .map(this::toItemDocument)
                .collect(Collectors.toList());

        return MealLogDocument.builder()
                .id(domain.getId())
                .userId(domain.getUserId())
                .mealType(domain.getMealType())
                .consumedAt(domain.getConsumedAt())
                .photoKey(domain.getPhotoKey())
                .items(itemDocuments)
                .totalCalories(domain.getTotalCalories())
                .totalProteins(domain.getTotalProteins())
                .totalCarbs(domain.getTotalCarbs())
                .totalFats(domain.getTotalFats())
                .build();
    }

    private MealItemDocument toItemDocument(MealItem domainItem) {
        return MealItemDocument.builder()
                .barcode(domainItem.getBarcode())
                .foodName(domainItem.getFoodName())
                .consumedGrams(domainItem.getConsumedGrams())
                .calories(domainItem.getCalories())
                .proteins(domainItem.getProteins())
                .carbohydrates(domainItem.getCarbohydrates())
                .fats(domainItem.getFats())
                .fiberGrams(domainItem.getFiberGrams())
                .sodiumMg(domainItem.getSodiumMg())
                .sugarGrams(domainItem.getSugarGrams())
                .potassiumMg(domainItem.getPotassiumMg())
                .build();
    }

    // --- Mappers: Document to Domain ---

    private MealLog toDomain(MealLogDocument document) {
        List<MealItem> domainItems = document.getItems().stream()
                .map(this::toItemDomain)
                .collect(Collectors.toList());

        // Using toBuilder() or explicit builder to reconstruct the aggregate
        // bypassing strict factory validations since data is already trusted (from DB).
        return MealLog.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .mealType(document.getMealType())
                .consumedAt(document.getConsumedAt())
                .photoKey(document.getPhotoKey())
                .items(domainItems)
                .totalCalories(document.getTotalCalories())
                .totalProteins(document.getTotalProteins())
                .totalCarbs(document.getTotalCarbs())
                .totalFats(document.getTotalFats())
                .build();
    }

    private MealItem toItemDomain(MealItemDocument docItem) {
        return MealItem.builder()
                .barcode(docItem.getBarcode())
                .foodName(docItem.getFoodName())
                .consumedGrams(docItem.getConsumedGrams())
                .calories(docItem.getCalories())
                .proteins(docItem.getProteins())
                .carbohydrates(docItem.getCarbohydrates())
                .fats(docItem.getFats())
                .fiberGrams(docItem.getFiberGrams())
                .sodiumMg(docItem.getSodiumMg())
                .sugarGrams(docItem.getSugarGrams())
                .potassiumMg(docItem.getPotassiumMg())
                .build();
    }
}