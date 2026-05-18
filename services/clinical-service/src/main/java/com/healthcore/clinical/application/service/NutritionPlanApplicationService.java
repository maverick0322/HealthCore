package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealOptionDraft;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSectionDraft;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientDraft;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import com.healthcore.clinical.domain.port.out.NutritionPlanRepositoryPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NutritionPlanApplicationService implements ManageNutritionPlanUseCase {

    private static final String MODE_SELF_MANAGED = "SELF_MANAGED";
    private static final String MODE_READ_ONLY = "READ_ONLY";
    private static final String MODE_NUTRITIONIST = "NUTRITIONIST";

    private final ClinicalRepositoryPort clinicalRepositoryPort;
    private final NutritionPlanRepositoryPort nutritionPlanRepositoryPort;
    private final NutritionCatalogPort nutritionCatalogPort;

    public NutritionPlanApplicationService(
            ClinicalRepositoryPort clinicalRepositoryPort,
            NutritionPlanRepositoryPort nutritionPlanRepositoryPort,
            NutritionCatalogPort nutritionCatalogPort
    ) {
        this.clinicalRepositoryPort = clinicalRepositoryPort;
        this.nutritionPlanRepositoryPort = nutritionPlanRepositoryPort;
        this.nutritionCatalogPort = nutritionCatalogPort;
    }

    @Override
    public NutritionPlanView getMyNutritionPlan(String patientId) {
        PatientProfile profile = getRequiredProfile(patientId);
        DailyGoalsSnapshot dailyGoals = buildDailyGoals(profile);

        if (isLinked(profile)) {
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

    @Override
    public NutritionPlanView upsertMyNutritionPlan(String patientId, NutritionPlanDraft nutritionPlanDraft) {
        PatientProfile profile = getRequiredProfile(patientId);
        if (isLinked(profile)) {
            throw new AccessDeniedException("Linked patients cannot edit their nutrition plan.");
        }

        DailyGoalsSnapshot dailyGoals = buildDailyGoals(profile);
        List<MealSection> calculatedSections = calculateSections(nutritionPlanDraft.sections());
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

    @Override
    public NutritionPlanView getNutritionistPatientNutritionPlan(String nutritionistId, String patientId) {
        PatientProfile profile = getProfileForNutritionist(nutritionistId, patientId);
        DailyGoalsSnapshot dailyGoals = buildDailyGoals(profile);

        Optional<NutritionPlan> activeNutritionistPlan = nutritionPlanRepositoryPort
                .findActiveByPatientIdAndAuthorTypeAndAuthorId(patientId, AuthorType.NUTRITIONIST, nutritionistId);
        NutritionPlan contextSelfManagedPlan = nutritionPlanRepositoryPort
                .findLatestByPatientIdAndAuthorType(patientId, AuthorType.SELF_MANAGED)
                .orElse(null);

        return activeNutritionistPlan
                .map(plan -> new NutritionPlanView(
                        MODE_NUTRITIONIST,
                        plan.getAuthorType(),
                        true,
                        dailyGoals,
                        plan.getSections(),
                        contextSelfManagedPlan
                ))
                .orElseGet(() -> new NutritionPlanView(
                        MODE_NUTRITIONIST,
                        null,
                        true,
                        dailyGoals,
                        emptySections(),
                        contextSelfManagedPlan
                ));
    }

    @Override
    public NutritionPlanView upsertNutritionistPatientNutritionPlan(
            String nutritionistId,
            String patientId,
            NutritionPlanDraft nutritionPlanDraft
    ) {
        PatientProfile profile = getProfileForNutritionist(nutritionistId, patientId);
        DailyGoalsSnapshot dailyGoals = buildDailyGoals(profile);
        List<MealSection> calculatedSections = calculateSections(nutritionPlanDraft.sections());

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

    @Override
    public List<CatalogFoodItem> searchCatalogFoods(String query) {
        return nutritionCatalogPort.searchFoods(query);
    }

    @Override
    public void archivePlansAfterUnlink(String patientId, String nutritionistId) {
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

    private PatientProfile getRequiredProfile(String patientId) {
        return clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));
    }

    private PatientProfile getProfileForNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = getRequiredProfile(patientId);
        if (!nutritionistId.equals(profile.getNutritionistId())) {
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }
        return profile;
    }

    private DailyGoalsSnapshot buildDailyGoals(PatientProfile profile) {
        HealthGoal healthGoal = profile.generateHealthGoals();
        return DailyGoalsSnapshot.fromHealthGoal(healthGoal);
    }

    private NutritionPlanView emptyView(String mode, boolean canEdit, DailyGoalsSnapshot dailyGoals) {
        return new NutritionPlanView(mode, null, canEdit, dailyGoals, emptySections(), null);
    }

    private boolean isLinked(PatientProfile profile) {
        return profile.getNutritionistId() != null && !profile.getNutritionistId().isBlank();
    }

    private List<MealSection> calculateSections(List<MealSectionDraft> sectionDrafts) {
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

    private MealOption calculateMealOption(MealOptionDraft mealOptionDraft) {
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

    private List<MealSection> emptySections() {
        return Arrays.stream(MealSlot.values())
                .sorted(Comparator.comparingInt(Enum::ordinal))
                .map(mealSlot -> new MealSection(mealSlot, List.of()))
                .toList();
    }
}
