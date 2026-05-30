package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.MealOptionDraft;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSectionDraft;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.PlanIngredientDraft;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionPlanDraftCalculatorTest {

    @Mock
    private NutritionCatalogPort nutritionCatalogPort;

    @Test
    void shouldCalculateSectionsFromDraft() {
        NutritionPlanDraftCalculator calculator = new NutritionPlanDraftCalculator(nutritionCatalogPort);
        when(nutritionCatalogPort.getFoodByBarcode("food-1")).thenReturn(Optional.of(createCatalogItem()));

        List<MealSection> sections = calculator.calculateSections(createDraftSections());

        assertEquals(4, sections.size());
        assertEquals(1, sections.get(0).options().size());
        assertEquals(4000, sections.get(0).options().get(0).totalCalories());
    }

    @Test
    void shouldRejectMissingMealSlotSection() {
        NutritionPlanDraftCalculator calculator = new NutritionPlanDraftCalculator(nutritionCatalogPort);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> calculator.calculateSections(List.of(
                        new MealSectionDraft(MealSlot.BREAKFAST, List.of()),
                        new MealSectionDraft(MealSlot.LUNCH, List.of()),
                        new MealSectionDraft(MealSlot.DINNER, List.of()),
                        new MealSectionDraft(MealSlot.BREAKFAST, List.of())
                ))
        );

        assertEquals("Missing section for meal slot: SNACK", exception.getMessage());
    }

    private List<MealSectionDraft> createDraftSections() {
        List<PlanIngredientDraft> ingredients = List.of(
                new PlanIngredientDraft("food-1", PlanIngredientUnit.GRAMS, 1000)
        );
        MealOptionDraft breakfastOption = new MealOptionDraft("Huge Oats", "Mix", "None", ingredients);

        return List.of(
                new MealSectionDraft(MealSlot.BREAKFAST, List.of(breakfastOption)),
                new MealSectionDraft(MealSlot.LUNCH, List.of()),
                new MealSectionDraft(MealSlot.DINNER, List.of()),
                new MealSectionDraft(MealSlot.SNACK, List.of())
        );
    }

    private CatalogFoodItem createCatalogItem() {
        return new CatalogFoodItem("food-1", "Oats", "Brand", "", 400, 20, 60, 15);
    }
}
