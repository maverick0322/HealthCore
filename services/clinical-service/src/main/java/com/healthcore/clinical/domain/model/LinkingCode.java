package com.healthcore.clinical.domain.model;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class LinkingCode {
    public static final long TTL_MINUTES = 15;

    private final String code;
    private final String nutritionistId;
    private final LocalDateTime createdAt;

    public LinkingCode(String code, String nutritionistId, LocalDateTime createdAt) {
        this.code = code;
        this.nutritionistId = nutritionistId;
        this.createdAt = createdAt;
    }

    public String getCode() { return code; }
    public String getNutritionistId() { return nutritionistId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public boolean isExpiredAt(LocalDateTime now) {
        return !createdAt.plus(TTL_MINUTES, ChronoUnit.MINUTES).isAfter(now);
    }
}
