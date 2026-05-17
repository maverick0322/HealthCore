package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate Root representing a water consumption event.
 * Distinct from MealLog to strictly enforce business boundaries.
 */
@Getter
@Builder(toBuilder = true)
public class WaterLog {

    private static final int MIN_WATER_AMOUNT_ML = 1;
    private static final int MAX_WATER_AMOUNT_ML = 5000;

    private final String id;
    private final String userId;
    private final int amountMl;
    private final LocalDateTime consumedAt;

    /**
     * Factory method to enforce invariants for water consumption.
     */
    public static WaterLog create(String userId, int amountMl, LocalDateTime consumedAt) {
        if (amountMl < MIN_WATER_AMOUNT_ML || amountMl > MAX_WATER_AMOUNT_ML) {
            throw new InvalidDomainDataException(
                    String.format("Water amount must be between %d and %d ml.", MIN_WATER_AMOUNT_ML, MAX_WATER_AMOUNT_ML)
            );
        }

        return WaterLog.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .amountMl(amountMl)
                .consumedAt(consumedAt != null ? consumedAt : LocalDateTime.now())
                .build();
    }
}