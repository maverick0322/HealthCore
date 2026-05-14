package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "linking_codes")
public class LinkingCodeDocument {

    @Id
    private String code;
    private String nutritionistId;

    @Indexed(expireAfter = "15m") 
    private LocalDateTime createdAt;

    public LinkingCodeDocument() {}

    public LinkingCodeDocument(String code, String nutritionistId, LocalDateTime createdAt) {
        this.code = code;
        this.nutritionistId = nutritionistId;
        this.createdAt = createdAt;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getNutritionistId() { return nutritionistId; }
    public void setNutritionistId(String nutritionistId) { this.nutritionistId = nutritionistId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}