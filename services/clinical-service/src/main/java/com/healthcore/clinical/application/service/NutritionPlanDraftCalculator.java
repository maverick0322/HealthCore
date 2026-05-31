package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealOptionDraft;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSectionDraft;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientDraft;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class NutritionPlanDraftCalculator {

    private static final Logger logger = LoggerFactory.getLogger(NutritionPlanDraftCalculator.class);

    private final NutritionCatalogPort nutritionCatalogPort;

    public NutritionPlanDraftCalculator(NutritionCatalogPort nutritionCatalogPort) {
        this.nutritionCatalogPort = nutritionCatalogPort;
    }

    public List<MealSection> calculateSections(List<MealSectionDraft> sectionDrafts) {
        logger.debug("[NutritionPlanDraftCalculator] Calculating sections count={}", sectionDrafts.size());
        return Arrays.stream(MealSlot.values())
                .map(mealSlot -> {
                    MealSectionDraft matchingSection = sectionDrafts.stream()
                            .filter(sectionDraft -> sectionDraft.mealSlot() == mealSlot)
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException("Missing section for meal slot: " + mealSlot));
                    List<MealOption> options = matchingSection.options().stream()
                            .map(this::calculateMealOption)
                            .toList();
                    return new MealSection(mealSlot, options);
                })
                .toList();
    }

    public List<MealSection> emptySections() {
        return Arrays.stream(MealSlot.values())
                .sorted(Comparator.comparingInt(Enum::ordinal))
                .map(mealSlot -> new MealSection(mealSlot, List.of()))
                .toList();
    }

    private MealOption calculateMealOption(MealOptionDraft mealOptionDraft) {
        logger.debug("[NutritionPlanDraftCalculator] Calculating meal option name={} ingredients={}",
                mealOptionDraft.name(), mealOptionDraft.ingredients().size());
        List<PlanIngredient> ingredients = mealOptionDraft.ingredients().stream()
                .map(this::calculateIngredient)
                .toList();

        int totalCalories = ingredients.stream().mapToInt(PlanIngredient::calories).sum();
        int totalProtein = ingredients.stream().mapToInt(PlanIngredient::proteinGrams).sum();
        int totalCarbs = ingredients.stream().mapToInt(PlanIngredient::carbsGrams).sum();
        int totalFat = ingredients.stream().mapToInt(PlanIngredient::fatGrams).sum();

        return new MealOption(
                UUID.randomUUID().toString(),
                mealOptionDraft.name(),
                mealOptionDraft.instructions(),
                mealOptionDraft.notes(),
                ingredients,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat
        );
    }

    private PlanIngredient calculateIngredient(PlanIngredientDraft ingredientDraft) {
        logger.debug("[NutritionPlanDraftCalculator] Calculating ingredient barcode={} quantity={} unit={}",
                ingredientDraft.barcode(), ingredientDraft.quantityAmount(), ingredientDraft.unit());
        CatalogFoodItem catalogFoodItem = nutritionCatalogPort.getFoodByBarcode(ingredientDraft.barcode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Catalog food not found for barcode: " + ingredientDraft.barcode()
                ));

        double multiplier = ingredientDraft.quantityAmount() / 100.0;

        return new PlanIngredient(
                catalogFoodItem.barcode(),
                catalogFoodItem.name(),
                catalogFoodItem.brand(),
                catalogFoodItem.imageUrl(),
                ingredientDraft.unit(),
                ingredientDraft.quantityAmount(),
                roundMacro(catalogFoodItem.caloriesPer100Units() * multiplier),
                roundMacro(catalogFoodItem.proteinPer100Units() * multiplier),
                roundMacro(catalogFoodItem.carbsPer100Units() * multiplier),
                roundMacro(catalogFoodItem.fatPer100Units() * multiplier)
        );
    }

    private int roundMacro(double value) {
        return (int) Math.round(value);
    }
}
