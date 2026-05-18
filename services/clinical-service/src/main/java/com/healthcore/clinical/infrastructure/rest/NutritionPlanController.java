package com.healthcore.clinical.infrastructure.rest;

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
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CatalogFoodResponse;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanIngredientResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanIngredientRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanMealOptionResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanMealOptionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanSectionResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanSectionRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanUpsertRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanViewResponse;
import com.healthcore.clinical.infrastructure.rest.dto.ReadonlyNutritionPlanResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinical")
public class NutritionPlanController {

    private final ManageNutritionPlanUseCase manageNutritionPlanUseCase;

    public NutritionPlanController(ManageNutritionPlanUseCase manageNutritionPlanUseCase) {
        this.manageNutritionPlanUseCase = manageNutritionPlanUseCase;
    }

    @GetMapping("/nutrition-plan/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<NutritionPlanViewResponse> getMyNutritionPlan(@RequestHeader("X-User-Id") String patientId) {
        return ResponseEntity.ok(toViewResponse(manageNutritionPlanUseCase.getMyNutritionPlan(patientId)));
    }

    @PutMapping("/nutrition-plan/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<NutritionPlanViewResponse> upsertMyNutritionPlan(
            @RequestHeader("X-User-Id") String patientId,
            @Valid @RequestBody NutritionPlanUpsertRequest request
    ) {
        NutritionPlanDraft draft = toDraft(request);
        return ResponseEntity.ok(toViewResponse(manageNutritionPlanUseCase.upsertMyNutritionPlan(patientId, draft)));
    }

    @GetMapping("/nutritionist/patients/{patientId}/nutrition-plan")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionPlanViewResponse> getNutritionistPatientNutritionPlan(
            @PathVariable String patientId
    ) {
        return ResponseEntity.ok(toViewResponse(
                manageNutritionPlanUseCase.getNutritionistPatientNutritionPlan(getCurrentUserId(), patientId)
        ));
    }

    @PutMapping("/nutritionist/patients/{patientId}/nutrition-plan")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionPlanViewResponse> upsertNutritionistPatientNutritionPlan(
            @PathVariable String patientId,
            @Valid @RequestBody NutritionPlanUpsertRequest request
    ) {
        return ResponseEntity.ok(toViewResponse(manageNutritionPlanUseCase.upsertNutritionistPatientNutritionPlan(
                getCurrentUserId(),
                patientId,
                toDraft(request)
        )));
    }

    @GetMapping("/catalog/foods/search")
    @PreAuthorize("hasAnyRole('PATIENT','NUTRITIONIST')")
    public ResponseEntity<List<CatalogFoodResponse>> searchCatalogFoods(@RequestParam String query) {
        List<CatalogFoodResponse> response = manageNutritionPlanUseCase.searchCatalogFoods(query).stream()
                .map(this::toCatalogFoodResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    private NutritionPlanDraft toDraft(NutritionPlanUpsertRequest request) {
        List<MealSectionDraft> sections = request.sections().stream()
                .map(this::toSectionDraft)
                .toList();
        return new NutritionPlanDraft(sections);
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

    private NutritionPlanViewResponse toViewResponse(NutritionPlanView view) {
        return new NutritionPlanViewResponse(
                view.mode(),
                view.authorType() != null ? view.authorType().name() : null,
                view.canEdit(),
                toGoalsResponse(view.dailyGoals()),
                view.sections().stream().map(this::toSectionResponse).toList(),
                toReadonlyResponse(view.contextSelfManagedPlan())
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

    private CatalogFoodResponse toCatalogFoodResponse(CatalogFoodItem foodItem) {
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

    private String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}
