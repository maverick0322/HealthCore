package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NutritionPlanApplicationService implements ManageNutritionPlanUseCase {

    private static final Logger logger = LoggerFactory.getLogger(NutritionPlanApplicationService.class);

    private final PatientNutritionPlanApplicationService patientNutritionPlanApplicationService;
    private final NutritionistNutritionPlanApplicationService nutritionistNutritionPlanApplicationService;
    private final NutritionCatalogPort nutritionCatalogPort;

    public NutritionPlanApplicationService(
            PatientNutritionPlanApplicationService patientNutritionPlanApplicationService,
            NutritionistNutritionPlanApplicationService nutritionistNutritionPlanApplicationService,
            NutritionCatalogPort nutritionCatalogPort
    ) {
        this.patientNutritionPlanApplicationService = patientNutritionPlanApplicationService;
        this.nutritionistNutritionPlanApplicationService = nutritionistNutritionPlanApplicationService;
        this.nutritionCatalogPort = nutritionCatalogPort;
    }

    @Override
    public NutritionPlanView getMyNutritionPlan(String patientId) {
        return patientNutritionPlanApplicationService.getMyNutritionPlan(patientId);
    }

    @Override
    public NutritionPlanView upsertMyNutritionPlan(String patientId, NutritionPlanDraft nutritionPlanDraft) {
        return patientNutritionPlanApplicationService.upsertMyNutritionPlan(patientId, nutritionPlanDraft);
    }

    @Override
    public NutritionPlanView getNutritionistPatientNutritionPlan(String nutritionistId, String patientId) {
        return nutritionistNutritionPlanApplicationService.getNutritionistPatientNutritionPlan(nutritionistId, patientId);
    }

    @Override
    public NutritionPlanView upsertNutritionistPatientNutritionPlan(
            String nutritionistId,
            String patientId,
            NutritionPlanDraft nutritionPlanDraft
    ) {
        return nutritionistNutritionPlanApplicationService.upsertNutritionistPatientNutritionPlan(
                nutritionistId,
                patientId,
                nutritionPlanDraft
        );
    }

    @Override
    public List<CatalogFoodItem> searchCatalogFoods(String query) {
        logger.info("[NutritionPlanApplicationService] Searching catalog foods query='{}'", query);
        return nutritionCatalogPort.searchFoods(query);
    }

    @Override
    public void archivePlansAfterUnlink(String patientId, String nutritionistId) {
        nutritionistNutritionPlanApplicationService.archivePlansAfterUnlink(patientId, nutritionistId);
    }
}
