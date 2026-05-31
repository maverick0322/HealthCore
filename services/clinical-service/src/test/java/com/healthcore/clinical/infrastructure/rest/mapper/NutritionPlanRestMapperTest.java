package com.healthcore.clinical.infrastructure.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.domain.model.PlanStatus;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanIngredientRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanMealOptionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanSectionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanUpsertRequest;

class NutritionPlanRestMapperTest {

    private final NutritionPlanRestMapper mapper = new NutritionPlanRestMapper();

    @Test
    void shouldMapUpsertRequestToDraft() {
        NutritionPlanUpsertRequest request = new NutritionPlanUpsertRequest(List.of(
                new NutritionPlanSectionRequest(
                        "breakfast",
                        List.of(new NutritionPlanMealOptionRequest(
                                "Avena",
                                "Cocinar",
                                "Sin azucar",
                                List.of(new NutritionPlanIngredientRequest("food-1", "grams", 80.0))
                        ))
                ),
                new NutritionPlanSectionRequest("lunch", List.of()),
                new NutritionPlanSectionRequest("dinner", List.of()),
                new NutritionPlanSectionRequest("snack", List.of())
        ));

        var draft = mapper.toDraft(request);

        assertEquals(4, draft.sections().size());
        assertEquals(MealSlot.BREAKFAST, draft.sections().getFirst().mealSlot());
        assertEquals("Avena", draft.sections().getFirst().options().getFirst().name());
        assertEquals(PlanIngredientUnit.GRAMS, draft.sections().getFirst().options().getFirst().ingredients().getFirst().unit());
    }

    @Test
    void shouldMapNutritionPlanViewToResponseWithReadonlyContext() {
        NutritionPlanView view = createView(createContextPlan());

        var response = mapper.toViewResponse(view);

        assertEquals("NUTRITIONIST", response.mode());
        assertEquals("NUTRITIONIST", response.authorType());
        assertEquals(2000, response.dailyGoals().targetCalories());
        assertEquals("BREAKFAST", response.sections().getFirst().mealSlot());
        assertNotNull(response.contextSelfManagedPlan());
        assertEquals("SELF_MANAGED", response.contextSelfManagedPlan().authorType());
    }

    @Test
    void shouldMapNutritionPlanViewWithoutReadonlyContext() {
        NutritionPlanView view = createView(null);

        var response = mapper.toViewResponse(view);

        assertNull(response.contextSelfManagedPlan());
    }

    @Test
    void shouldMapCatalogFoodToResponse() {
        CatalogFoodItem foodItem = new CatalogFoodItem("food-1", "Oats", "Brand", "img", 100, 10, 20, 5);

        var response = mapper.toCatalogFoodResponse(foodItem);

        assertEquals("food-1", response.barcode());
        assertEquals("Oats", response.name());
        assertEquals(100, response.caloriesPer100Units());
    }

    private NutritionPlanView createView(NutritionPlan contextPlan) {
        DailyGoalsSnapshot dailyGoalsSnapshot = new DailyGoalsSnapshot(2000, 120, 180, 60, 10);
        PlanIngredient ingredient = new PlanIngredient("food-1", "Oats", "Brand", "", PlanIngredientUnit.GRAMS, 100, 300, 15, 40, 10);
        MealOption breakfast = new MealOption("meal-1", "Avena", "Cocinar", "Pera si no hay manzana", List.of(ingredient), 300, 15, 40, 10);
        List<MealSection> sections = List.of(
                new MealSection(MealSlot.BREAKFAST, List.of(breakfast)),
                new MealSection(MealSlot.LUNCH, List.of()),
                new MealSection(MealSlot.DINNER, List.of()),
                new MealSection(MealSlot.SNACK, List.of())
        );

        return new NutritionPlanView(
                "NUTRITIONIST",
                AuthorType.NUTRITIONIST,
                false,
                dailyGoalsSnapshot,
                sections,
                contextPlan
        );
    }

    private NutritionPlan createContextPlan() {
        return NutritionPlan.rehydrate(
                "context-1",
                "patient-123",
                AuthorType.SELF_MANAGED,
                "patient-123",
                PlanStatus.ARCHIVED,
                new DailyGoalsSnapshot(1800, 100, 160, 55, 9),
                List.of(
                        new MealSection(MealSlot.BREAKFAST, List.of()),
                        new MealSection(MealSlot.LUNCH, List.of()),
                        new MealSection(MealSlot.DINNER, List.of()),
                        new MealSection(MealSlot.SNACK, List.of())
                ),
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().minusDays(1)
        );
    }
}
