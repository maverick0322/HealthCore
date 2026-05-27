package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root representing a complete meal event logged by a user.
 * Orchestrates its child items (MealItem) and enforces consistency across the entire meal block.
 */
@Getter
@Builder(toBuilder = true)
public class MealLog {

    private final String id;
    private final String userId;
    private final String mealName;
    private final MealType mealType;
    private final LocalDateTime consumedAt;
    private final String photoKey; // Cloudflare R2 reference, decoupled from actual media storage

    private final List<MealItem> items;

    private final double totalCalories;
    private final double totalProteins;
    private final double totalCarbs;
    private final double totalFats;

    /**
     * Factory method ensuring a MealLog cannot be created without items,
     * and calculating global meal totals cleanly using Stream API.
     */
    public static MealLog create(String userId, String mealName, MealType mealType, LocalDateTime consumedAt, String photoKey, List<MealItem> items) {
        if (mealName == null || mealName.isBlank() || mealName.length() > 60) {
            throw new InvalidDomainDataException("Meal name is invalid or exceeds 60 characters.");
        }
        if (items == null || items.isEmpty()) {
            throw new InvalidDomainDataException("A meal log must contain at least one food item.");
        }

        double totalCalories = items.stream().mapToDouble(MealItem::getCalories).sum();
        double totalProteins = items.stream().mapToDouble(MealItem::getProteins).sum();
        double totalCarbs = items.stream().mapToDouble(MealItem::getCarbohydrates).sum();
        double totalFats = items.stream().mapToDouble(MealItem::getFats).sum();

        return MealLog.builder()
                .id(UUID.randomUUID().toString()) // Generated at the domain level
                .userId(userId)
                .mealName(mealName)
                .mealType(mealType)
                .consumedAt(consumedAt != null ? consumedAt : LocalDateTime.now(ZoneId.of("America/Mexico_City")))
                .photoKey(photoKey)
                .items(List.copyOf(items)) // Defensive copy to guarantee absolute immutability
                .totalCalories(totalCalories)
                .totalProteins(totalProteins)
                .totalCarbs(totalCarbs)
                .totalFats(totalFats)
                .build();
    }
}