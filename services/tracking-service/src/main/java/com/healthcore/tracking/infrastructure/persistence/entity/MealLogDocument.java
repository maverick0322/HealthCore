package com.healthcore.tracking.infrastructure.persistence.entity;

import com.healthcore.tracking.domain.model.MealType;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Document(collection = "meal_logs")
public class MealLogDocument {
    @Id
    private String id;
    private String userId;
    private String mealName;
    private MealType mealType;
    private LocalDateTime consumedAt;
    private String photoKey;

    private List<MealItemDocument> items; // Embedded array in MongoDB

    private double totalCalories;
    private double totalProteins;
    private double totalCarbs;
    private double totalFats;
}