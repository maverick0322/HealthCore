package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.model.MealType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for incoming meal consumption requests.
 * Modeled as a Java Record for absolute immutability and thread-safety.
 */
public record MealLogRequest(
        @NotNull(message = "Meal type is required.")
        MealType mealType,

        @NotNull(message = "Consumption date and time are required.")
        @PastOrPresent(message = "Consumption time cannot be in the future.")
        LocalDateTime consumedAt,

        String photoKey, // Optional reference to Cloudflare R2 media

        @NotEmpty(message = "A meal must contain at least one food item.")
        @Valid
        List<FoodItemRequest> foods
) {
        /**
         * Nested record representing individual items within the meal request.
         */
        public record FoodItemRequest(
                @NotBlank(message = "Barcode is required and cannot be blank.")
                String barcode,

                @Positive(message = "Consumption amount must be strictly positive.")
                double grams
        ) {}
}