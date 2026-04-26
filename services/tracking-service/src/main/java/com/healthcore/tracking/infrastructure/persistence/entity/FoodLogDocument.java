package com.healthcore.tracking.infrastructure.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "foodLogDocument")
//Building index on second thought to optimize queries.
//Querying by userId and sorting by consumedAt
@CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'consumedAt': -1}")
public class FoodLogDocument {

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