package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;

import java.util.List;

public interface ManageNutritionPlanUseCase {
    NutritionPlanView getMyNutritionPlan(String patientId);
    NutritionPlanView upsertMyNutritionPlan(String patientId, NutritionPlanDraft nutritionPlanDraft);
    NutritionPlanView getNutritionistPatientNutritionPlan(String nutritionistId, String patientId);
    NutritionPlanView upsertNutritionistPatientNutritionPlan(
            String nutritionistId,
            String patientId,
            NutritionPlanDraft nutritionPlanDraft
    );
    List<CatalogFoodItem> searchCatalogFoods(String query);
    void archivePlansAfterUnlink(String patientId, String nutritionistId);
}
