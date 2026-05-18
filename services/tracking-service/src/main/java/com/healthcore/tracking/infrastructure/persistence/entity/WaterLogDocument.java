package com.healthcore.tracking.infrastructure.persistence.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * MongoDB Document representation for Water consumption.
 * Strictly decoupled from the Domain layer to allow database schema evolution
 * without affecting business rules.
 */
@Data
@Builder
@Document(collection = "water_logs")
public class WaterLogDocument {
    @Id
    private String id;

    // Indexado para evitar Collection Scans en las agregaciones del dashboard
    @Indexed
    private String userId;

    private int amountMl;

    @Indexed
    private LocalDateTime consumedAt;
}