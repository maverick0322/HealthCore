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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientNutritionPlanApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(PatientNutritionPlanApplicationService.class);

    public static final String MODE_SELF_MANAGED = "SELF_MANAGED";
    public static final String MODE_READ_ONLY = "READ_ONLY";

    private final NutritionPlanProfileContextService nutritionPlanProfileContextService;
    private final NutritionPlanRepositoryPort nutritionPlanRepositoryPort;
    private final NutritionPlanDraftCalculator nutritionPlanDraftCalculator;

    public PatientNutritionPlanApplicationService(
            NutritionPlanProfileContextService nutritionPlanProfileContextService,
            NutritionPlanRepositoryPort nutritionPlanRepositoryPort,
            NutritionPlanDraftCalculator nutritionPlanDraftCalculator
    ) {
        this.nutritionPlanProfileContextService = nutritionPlanProfileContextService;
        this.nutritionPlanRepositoryPort = nutritionPlanRepositoryPort;
        this.nutritionPlanDraftCalculator = nutritionPlanDraftCalculator;
    }

    public NutritionPlanView getMyNutritionPlan(String patientId) {
        logger.info("[PatientNutritionPlanApplicationService] Resolving patient nutrition plan for patientId={}", patientId);
        PatientProfile profile = nutritionPlanProfileContextService.getRequiredProfile(patientId);
        DailyGoalsSnapshot dailyGoals = nutritionPlanProfileContextService.buildDailyGoals(profile);

        if (nutritionPlanProfileContextService.isLinked(profile)) {
            Optional<NutritionPlan> nutritionistPlan = nutritionPlanRepositoryPort
                    .findActiveByPatientIdAndAuthorTypeAndAuthorId(
                            patientId,
                            AuthorType.NUTRITIONIST,
                            profile.getNutritionistId()
                    );

            return nutritionistPlan
                    .map(plan -> new NutritionPlanView(
                            MODE_READ_ONLY,
                            plan.getAuthorType(),
                            false,
                            dailyGoals,
                            plan.getSections(),
                            null
                    ))
                    .orElseGet(() -> emptyView(MODE_READ_ONLY, false, dailyGoals));
        }

        Optional<NutritionPlan> selfManagedPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.SELF_MANAGED, patientId);

        return selfManagedPlan
                .map(plan -> new NutritionPlanView(
                        MODE_SELF_MANAGED,
                        plan.getAuthorType(),
                        true,
                        dailyGoals,
                        plan.getSections(),
                        null
                ))
                .orElseGet(() -> emptyView(MODE_SELF_MANAGED, true, dailyGoals));
    }

    public NutritionPlanView upsertMyNutritionPlan(String patientId, NutritionPlanDraft nutritionPlanDraft) {
        logger.info("[PatientNutritionPlanApplicationService] Upserting self-managed plan for patientId={} sections={}",
                patientId, nutritionPlanDraft.sections().size());
        PatientProfile profile = nutritionPlanProfileContextService.getRequiredProfile(patientId);
        if (nutritionPlanProfileContextService.isLinked(profile)) {
            logger.warn("[PatientNutritionPlanApplicationService] Denied self-managed plan update for linked patientId={}",
                    patientId);
            throw new AccessDeniedException("Linked patients cannot edit their nutrition plan.");
        }

        DailyGoalsSnapshot dailyGoals = nutritionPlanProfileContextService.buildDailyGoals(profile);
        List<MealSection> calculatedSections = nutritionPlanDraftCalculator.calculateSections(nutritionPlanDraft.sections());
        Optional<NutritionPlan> existingPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.SELF_MANAGED, patientId);

        NutritionPlan savedPlan = existingPlan
                .map(plan -> updatePlan(plan, dailyGoals, calculatedSections))
                .orElseGet(() -> nutritionPlanRepositoryPort.save(
                        NutritionPlan.createActive(patientId, AuthorType.SELF_MANAGED, patientId, dailyGoals, calculatedSections)
                ));

        return new NutritionPlanView(
                MODE_SELF_MANAGED,
                savedPlan.getAuthorType(),
                true,
                dailyGoals,
                savedPlan.getSections(),
                null
        );
    }

    private NutritionPlanView emptyView(String mode, boolean canEdit, DailyGoalsSnapshot dailyGoals) {
        return new NutritionPlanView(mode, null, canEdit, dailyGoals, nutritionPlanDraftCalculator.emptySections(), null);
    }

    private NutritionPlan updatePlan(
            NutritionPlan existingPlan,
            DailyGoalsSnapshot dailyGoals,
            List<MealSection> calculatedSections
    ) {
        existingPlan.update(dailyGoals, calculatedSections);
        return nutritionPlanRepositoryPort.save(existingPlan);
    }
}
