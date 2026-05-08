package com.healthcore.clinical.domain.model;

import java.time.LocalDateTime;

public class LinkingCode {
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
}