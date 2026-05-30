package com.healthcore.clinical.infrastructure.rest.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealOptionDraft;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSectionDraft;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientDraft;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.infrastructure.rest.dto.CatalogFoodResponse;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanIngredientRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanIngredientResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanMealOptionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanMealOptionResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanSectionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanSectionResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanUpsertRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanViewResponse;
import com.healthcore.clinical.infrastructure.rest.dto.ReadonlyNutritionPlanResponse;

@Component
public class NutritionPlanRestMapper {

    public NutritionPlanDraft toDraft(NutritionPlanUpsertRequest request) {
        List<MealSectionDraft> sections = request.sections().stream()
                .map(this::toSectionDraft)
                .toList();
        return new NutritionPlanDraft(sections);
    }

    public NutritionPlanViewResponse toViewResponse(NutritionPlanView view) {
        return new NutritionPlanViewResponse(
                view.mode(),
                view.authorType() != null ? view.authorType().name() : null,
                view.canEdit(),
                toGoalsResponse(view.dailyGoals()),
                view.sections().stream().map(this::toSectionResponse).toList(),
                toReadonlyResponse(view.contextSelfManagedPlan())
        );
    }

    public CatalogFoodResponse toCatalogFoodResponse(CatalogFoodItem foodItem) {
        return new CatalogFoodResponse(
                foodItem.barcode(),
                foodItem.name(),
                foodItem.brand(),
                foodItem.imageUrl(),
                foodItem.caloriesPer100Units(),
                foodItem.proteinPer100Units(),
                foodItem.carbsPer100Units(),
                foodItem.fatPer100Units()
        );
    }

    private MealSectionDraft toSectionDraft(NutritionPlanSectionRequest request) {
        return new MealSectionDraft(
                com.healthcore.clinical.domain.model.MealSlot.valueOf(request.mealSlot().toUpperCase()),
                request.options().stream().map(this::toMealOptionDraft).toList()
        );
    }

    private MealOptionDraft toMealOptionDraft(NutritionPlanMealOptionRequest request) {
        return new MealOptionDraft(
                request.name(),
                request.instructions(),
                request.notes(),
                request.ingredients().stream().map(this::toIngredientDraft).toList()
        );
    }

    private PlanIngredientDraft toIngredientDraft(NutritionPlanIngredientRequest request) {
        return new PlanIngredientDraft(
                request.barcode(),
                PlanIngredientUnit.valueOf(request.unit().toUpperCase()),
                request.quantityAmount()
        );
    }

    private ReadonlyNutritionPlanResponse toReadonlyResponse(NutritionPlan nutritionPlan) {
        if (nutritionPlan == null) {
            return null;
        }
        return new ReadonlyNutritionPlanResponse(
                nutritionPlan.getAuthorType().name(),
                toGoalsResponse(nutritionPlan.getDailyGoalsSnapshot()),
                nutritionPlan.getSections().stream().map(this::toSectionResponse).toList(),
                nutritionPlan.getUpdatedAt()
        );
    }

    private HealthGoalResponse toGoalsResponse(DailyGoalsSnapshot snapshot) {
        return new HealthGoalResponse(
                snapshot.targetCalories(),
                snapshot.targetProtein(),
                snapshot.targetCarbs(),
                snapshot.targetFat(),
                snapshot.targetWaterGlasses()
        );
    }

    private NutritionPlanSectionResponse toSectionResponse(MealSection section) {
        return new NutritionPlanSectionResponse(
                section.mealSlot().name(),
                section.options().stream().map(this::toMealOptionResponse).toList()
        );
    }

    private NutritionPlanMealOptionResponse toMealOptionResponse(MealOption mealOption) {
        return new NutritionPlanMealOptionResponse(
                mealOption.id(),
                mealOption.name(),
                mealOption.instructions(),
                mealOption.notes(),
                mealOption.ingredients().stream().map(this::toIngredientResponse).toList(),
                mealOption.totalCalories(),
                mealOption.totalProtein(),
                mealOption.totalCarbs(),
                mealOption.totalFat()
        );
    }

    private NutritionPlanIngredientResponse toIngredientResponse(PlanIngredient ingredient) {
        return new NutritionPlanIngredientResponse(
                ingredient.barcode(),
                ingredient.name(),
                ingredient.brand(),
                ingredient.imageUrl(),
                ingredient.unit().name(),
                ingredient.quantityAmount(),
                ingredient.calories(),
                ingredient.proteinGrams(),
                ingredient.carbsGrams(),
                ingredient.fatGrams()
        );
    }
}
