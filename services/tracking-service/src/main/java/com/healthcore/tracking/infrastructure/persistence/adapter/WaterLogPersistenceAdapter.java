package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.WaterLog;
import com.healthcore.tracking.domain.port.WaterLogPort;
import com.healthcore.tracking.infrastructure.persistence.entity.WaterLogDocument;
import com.healthcore.tracking.infrastructure.persistence.exception.WaterLogPersistenceException;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoWaterLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Driven Adapter (Infrastructure): Isolates the core domain from MongoDB specifics.
 * Translates between Domain and Document, handling infrastructure failures defensively.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WaterLogPersistenceAdapter implements WaterLogPort {

    private final SpringDataMongoWaterLogRepository repository;

    @Override
    public WaterLog save(WaterLog waterLog) {
        if (waterLog == null) {
            log.error("Attempted to persist a null WaterLog entity.");
            throw new IllegalArgumentException("WaterLog cannot be null for persistence");
        }

        try {
            log.debug("Saving WaterLog to MongoDB. userHash={}", logHash(waterLog.getUserId()));
            WaterLogDocument document = toDocument(waterLog);
            WaterLogDocument savedDocument = repository.save(document);
            return toDomain(savedDocument);

        } catch (DataAccessException ex) {
            log.error("MongoDB DataAccessException while saving WaterLog. userHash={} errorClass={}",
                    logHash(waterLog.getUserId()), ex.getClass().getSimpleName());
            throw new WaterLogPersistenceException("Database error occurred while persisting water log.", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error saving WaterLog. userHash={} errorClass={}",
                    logHash(waterLog.getUserId()), ex.getClass().getSimpleName());
            throw new WaterLogPersistenceException("Unexpected error during water log persistence.", ex);
        }
    }

    @Override
    public Integer getConsumedWaterBetween(String userId, LocalDateTime start, LocalDateTime end) {
        if (userId == null || start == null || end == null) {
            log.error("Invalid parameters for getConsumedWaterBetween. userId, start, and end must not be null.");
            throw new IllegalArgumentException("Parameters cannot be null for querying water logs");
        }

        try {
            log.debug("Querying aggregated water consumption. userHash={} start={} end={}", logHash(userId), start, end);
            Integer totalMl = repository.sumWaterAmountByUserIdAndDateRange(userId, start, end);
            return totalMl != null ? totalMl : 0;

        } catch (DataAccessException ex) {
            log.error("MongoDB DataAccessException querying water aggregation. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new WaterLogPersistenceException("Database error occurred while aggregating water logs.", ex);
        } catch (Exception ex) {
            log.error("Unexpected infrastructure error querying water aggregation. userHash={} errorClass={}",
                    logHash(userId), ex.getClass().getSimpleName());
            throw new WaterLogPersistenceException("Unexpected error during water aggregation.", ex);
        }
    }

    // --- Mappers: Domain to Document ---

    private WaterLogDocument toDocument(WaterLog domain) {
        return WaterLogDocument.builder()
                .id(domain.getId())
                .userId(domain.getUserId())
                .amountMl(domain.getAmountMl())
                .consumedAt(domain.getConsumedAt())
                .build();
    }

    // --- Mappers: Document to Domain ---

    private WaterLog toDomain(WaterLogDocument document) {
        return WaterLog.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .amountMl(document.getAmountMl())
                .consumedAt(document.getConsumedAt())
                .build();
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
