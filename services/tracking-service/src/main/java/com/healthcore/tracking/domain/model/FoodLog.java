package com.healthcore.tracking.domain.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@Document(collection = "healthcore_food_logs")
public class FoodLog {
    @Id
    private String id;
    private String userId;
    private String barcode;
    private String foodName;
    private double consumedGrams;
    private double totalCalories;
    private double totalProteins;
    private double totalCarbs;
    private double totalFats;
    private LocalDateTime consumedAt;
}