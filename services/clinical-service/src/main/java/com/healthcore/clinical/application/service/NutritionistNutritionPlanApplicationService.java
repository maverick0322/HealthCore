package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.NutritionPlanRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NutritionistNutritionPlanApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(NutritionistNutritionPlanApplicationService.class);

    public static final String MODE_NUTRITIONIST = "NUTRITIONIST";

    private final NutritionPlanProfileContextService nutritionPlanProfileContextService;
    private final NutritionPlanRepositoryPort nutritionPlanRepositoryPort;
    private final NutritionPlanDraftCalculator nutritionPlanDraftCalculator;

    public NutritionistNutritionPlanApplicationService(
            NutritionPlanProfileContextService nutritionPlanProfileContextService,
            NutritionPlanRepositoryPort nutritionPlanRepositoryPort,
            NutritionPlanDraftCalculator nutritionPlanDraftCalculator
    ) {
        this.nutritionPlanProfileContextService = nutritionPlanProfileContextService;
        this.nutritionPlanRepositoryPort = nutritionPlanRepositoryPort;
        this.nutritionPlanDraftCalculator = nutritionPlanDraftCalculator;
    }

    public NutritionPlanView getNutritionistPatientNutritionPlan(String nutritionistId, String patientId) {
        logger.info("[NutritionistNutritionPlanApplicationService] Resolving nutritionist plan view for nutritionistId={} patientId={}",
                nutritionistId, patientId);
        PatientProfile profile = nutritionPlanProfileContextService.getProfileForNutritionist(nutritionistId, patientId);
        DailyGoalsSnapshot dailyGoals = nutritionPlanProfileContextService.buildDailyGoals(profile);

        Optional<NutritionPlan> activeNutritionistPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.NUTRITIONIST, nutritionistId);
        Optional<NutritionPlan> activeSelfManagedPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.SELF_MANAGED, patientId);
        NutritionPlan contextSelfManagedPlan = activeNutritionistPlan.isPresent()
                ? nutritionPlanRepositoryPort.findLatestByPatientIdAndAuthorType(patientId, AuthorType.SELF_MANAGED)
                .orElse(null)
                : null;

        if (activeNutritionistPlan.isPresent()) {
            NutritionPlan plan = activeNutritionistPlan.get();
            return new NutritionPlanView(
                    MODE_NUTRITIONIST,
                    plan.getAuthorType(),
                    true,
                    dailyGoals,
                    plan.getSections(),
                    contextSelfManagedPlan
            );
        }

        if (activeSelfManagedPlan.isPresent()) {
            NutritionPlan selfManagedPlan = activeSelfManagedPlan.get();
            return new NutritionPlanView(
                    MODE_NUTRITIONIST,
                    selfManagedPlan.getAuthorType(),
                    true,
                    dailyGoals,
                    selfManagedPlan.getSections(),
                    null
            );
        }

        return new NutritionPlanView(
                MODE_NUTRITIONIST,
                null,
                true,
                dailyGoals,
                nutritionPlanDraftCalculator.emptySections(),
                null
        );
    }

    public NutritionPlanView upsertNutritionistPatientNutritionPlan(
            String nutritionistId,
            String patientId,
            NutritionPlanDraft nutritionPlanDraft
    ) {
        logger.info("[NutritionistNutritionPlanApplicationService] Upserting nutritionist plan for nutritionistId={} patientId={} sections={}",
                nutritionistId, patientId, nutritionPlanDraft.sections().size());
        PatientProfile profile = nutritionPlanProfileContextService.getProfileForNutritionist(nutritionistId, patientId);
        DailyGoalsSnapshot dailyGoals = nutritionPlanProfileContextService.buildDailyGoals(profile);
        List<MealSection> calculatedSections = nutritionPlanDraftCalculator.calculateSections(nutritionPlanDraft.sections());

        nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.SELF_MANAGED, patientId)
                .ifPresent(this::archivePlan);

        Optional<NutritionPlan> existingPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.NUTRITIONIST, nutritionistId);

        NutritionPlan savedPlan = existingPlan
                .map(plan -> updatePlan(plan, dailyGoals, calculatedSections))
                .orElseGet(() -> nutritionPlanRepositoryPort.save(
                        NutritionPlan.createActive(patientId, AuthorType.NUTRITIONIST, nutritionistId, dailyGoals, calculatedSections)
                ));

        NutritionPlan contextSelfManagedPlan = nutritionPlanRepositoryPort
                .findLatestByPatientIdAndAuthorType(patientId, AuthorType.SELF_MANAGED)
                .orElse(null);

        return new NutritionPlanView(
                MODE_NUTRITIONIST,
                savedPlan.getAuthorType(),
                true,
                dailyGoals,
                savedPlan.getSections(),
                contextSelfManagedPlan
        );
    }

    public void archivePlansAfterUnlink(String patientId, String nutritionistId) {
        logger.info("[NutritionistNutritionPlanApplicationService] Archiving plans after unlink for patientId={} nutritionistId={}",
                patientId, nutritionistId);
        nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                patientId,
                AuthorType.NUTRITIONIST,
                nutritionistId
        ).ifPresent(this::archivePlan);

        nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                patientId,
                AuthorType.SELF_MANAGED,
                patientId
        ).ifPresent(this::archivePlan);
    }

    private NutritionPlan updatePlan(
            NutritionPlan existingPlan,
            DailyGoalsSnapshot dailyGoals,
            List<MealSection> calculatedSections
    ) {
        existingPlan.update(dailyGoals, calculatedSections);
        return nutritionPlanRepositoryPort.save(existingPlan);
    }

    private void archivePlan(NutritionPlan plan) {
        plan.archive();
        nutritionPlanRepositoryPort.save(plan);
    }
}
