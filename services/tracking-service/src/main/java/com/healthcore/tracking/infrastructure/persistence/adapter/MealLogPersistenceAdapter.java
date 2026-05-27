package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.infrastructure.persistence.entity.MealItemDocument;
import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import com.healthcore.tracking.infrastructure.persistence.exception.MealLogPersistenceException;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoMealLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
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
    private final MongoTemplate mongoTemplate;

    @Override
    public MealLog save(MealLog mealLog) {
        if (mealLog == null) {
            log.error("Attempted to save a null MealLog entity.");
            throw new IllegalArgumentException("MealLog domain entity cannot be null for persistence");
        }

        try {
            log.debug("Saving MealLog to MongoDB. userHash={}", logHash(mealLog.getUserId()));
            MealLogDocument document = toDocument(mealLog);
            MealLogDocument savedDocument = repository.save(document);
            return toDomain(savedDocument);
        } catch (DataAccessException ex) {
            log.error("Database error occurred while saving MealLog. userHash={} errorClass={}",
                    logHash(mealLog.getUserId()), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Failed to persist meal log due to a database error.", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error while saving MealLog. userHash={} errorClass={}",
                    logHash(mealLog.getUserId()), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("An unexpected error occurred during meal log persistence.", ex);
        }
    }

    @Override
    public List<MealLog> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end) {
        if (userId == null || start == null || end == null) {
            log.error("Invalid parameters for findByUserIdAndDateRange. Parameters cannot be null.");
            throw new IllegalArgumentException("Parameters cannot be null for querying meal logs");
        }

        try {
            log.debug("Querying MongoDB for MealLogs. userHash={} start={} end={}", logHash(userId), start, end);
            return repository.findByUserIdAndConsumedAtBetween(userId, start, end).stream()
                    .map(this::toDomain)
                    .collect(Collectors.toList());
        } catch (DataAccessException ex) {
            log.error("Database error querying MealLogs. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Failed to fetch meal logs due to a database error.", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error querying MealLogs. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Unexpected error during meal log retrieval.", ex);
        }
    }

    @Override
    public List<DailyMacroSummary> aggregateHistoricalMacros(String userId, LocalDateTime start, LocalDateTime end) {
        if (userId == null || start == null || end == null) {
            log.error("Invalid parameters for historical macro aggregation.");
            throw new IllegalArgumentException("Parameters cannot be null for macro aggregation");
        }

        try {
            log.debug("Executing native MongoDB aggregation for historical macros. userHash={} start={} end={}", logHash(userId), start, end);
            return repository.aggregateHistoricalMacros(userId, start, end);
        } catch (DataAccessException ex) {
            log.error("Database error while aggregating historical macros. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Failed to aggregate macros due to DB error", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error while aggregating historical macros. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Unexpected error during macro aggregation", ex);
        }
    }

    @Override
    public Set<LocalDate> findDistinctLoggedDatesByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            log.error("Invalid user id for distinct date query.");
            throw new IllegalArgumentException("UserId cannot be null or blank");
        }

        try {
            log.debug("Executing native distinct date extraction. userHash={}", logHash(userId));
            Query query = new Query(Criteria.where("userId").is(userId));

            List<LocalDateTime> dates = mongoTemplate.findDistinct(
                    query,
                    "consumedAt",
                    MealLogDocument.class,
                    LocalDateTime.class
            );

            return dates.stream()
                    .filter(date -> date != null)
                    .map(LocalDateTime::toLocalDate)
                    .collect(Collectors.toSet());

        } catch (DataAccessException ex) {
            log.error("Database error while extracting distinct dates. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new MealLogPersistenceException("Failed to extract distinct dates due to DB error", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error extracting distinct dates. userHash={} errorClass={} message={}",
                    logHash(userId), ex.getClass().getSimpleName(), ex.getMessage(), ex);
            throw new MealLogPersistenceException("Unexpected error during distinct date extraction", ex);
        }
    }

    // --- Mappers: Domain to Document ---

    private MealLogDocument toDocument(MealLog domain) {
        List<MealItemDocument> itemDocuments = domain.getItems().stream()
                .map(this::toItemDocument)
                .collect(Collectors.toList());

        return MealLogDocument.builder()
                .id(domain.getId())
                .userId(domain.getUserId())
                .mealName(domain.getMealName())
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

        String safeMealName = document.getMealName() != null && !document.getMealName().isBlank()
                ? document.getMealName()
                : document.getMealType().name();

        return MealLog.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .mealName(safeMealName)
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

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
