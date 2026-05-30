package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.MealOptionDraft;
import com.healthcore.clinical.domain.model.MealSectionDraft;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanDraft;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.PlanIngredientDraft;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import com.healthcore.clinical.domain.port.out.NutritionPlanRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientNutritionPlanApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @Mock
    private NutritionPlanRepositoryPort nutritionPlanRepositoryPort;

    @Mock
    private NutritionCatalogPort nutritionCatalogPort;

    @Test
    void shouldReturnSelfManagedViewWhenPatientHasActiveSelfManagedPlan() {
        PatientProfile patientProfile = createPatientProfile("patient-1", null);
        NutritionPlan selfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1800, 90, 180, 55, 9),
                emptySections()
        );
        PatientNutritionPlanApplicationService service = createService();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.SELF_MANAGED, "patient-1"
        )).thenReturn(Optional.of(selfManagedPlan));

        NutritionPlanView view = service.getMyNutritionPlan("patient-1");

        assertEquals("SELF_MANAGED", view.mode());
        assertTrue(view.canEdit());
        assertEquals(AuthorType.SELF_MANAGED, view.authorType());
    }

    @Test
    void shouldSaveSelfManagedPlanEvenWhenMealExceedsDailyGoals() {
        PatientProfile patientProfile = createPatientProfile("patient-1", null);
        PatientNutritionPlanApplicationService service = createService();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.SELF_MANAGED, "patient-1"
        )).thenReturn(Optional.empty());
        when(nutritionCatalogPort.getFoodByBarcode("food-1")).thenReturn(Optional.of(createCatalogItem()));
        when(nutritionPlanRepositoryPort.save(any(NutritionPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NutritionPlanView view = service.upsertMyNutritionPlan("patient-1", createDraft());

        assertTrue(view.canEdit());
        assertEquals("SELF_MANAGED", view.mode());
        assertEquals(1, view.sections().get(0).options().size());
        assertTrue(view.sections().get(0).options().get(0).totalCalories() > view.dailyGoals().targetCalories());
    }

    private PatientNutritionPlanApplicationService createService() {
        NutritionPlanProfileContextService contextService = new NutritionPlanProfileContextService(clinicalRepositoryPort);
        NutritionPlanDraftCalculator draftCalculator = new NutritionPlanDraftCalculator(nutritionCatalogPort);
        return new PatientNutritionPlanApplicationService(contextService, nutritionPlanRepositoryPort, draftCalculator);
    }

    private PatientProfile createPatientProfile(String userId, String nutritionistId) {
        PatientProfile profile = new PatientProfile(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.now().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );
        profile.setNutritionistId(nutritionistId);
        return profile;
    }

    private NutritionPlanDraft createDraft() {
        List<PlanIngredientDraft> ingredients = List.of(new PlanIngredientDraft("food-1", PlanIngredientUnit.GRAMS, 1000));
        MealOptionDraft breakfastOption = new MealOptionDraft("Huge Oats", "Mix", "None", ingredients);

        return new NutritionPlanDraft(List.of(
                new MealSectionDraft(MealSlot.BREAKFAST, List.of(breakfastOption)),
                new MealSectionDraft(MealSlot.LUNCH, List.of()),
                new MealSectionDraft(MealSlot.DINNER, List.of()),
                new MealSectionDraft(MealSlot.SNACK, List.of())
        ));
    }

    private CatalogFoodItem createCatalogItem() {
        return new CatalogFoodItem("food-1", "Oats", "Brand", "", 400, 20, 60, 15);
    }

    private List<com.healthcore.clinical.domain.model.MealSection> emptySections() {
        return List.of(
                new com.healthcore.clinical.domain.model.MealSection(MealSlot.BREAKFAST, List.of()),
                new com.healthcore.clinical.domain.model.MealSection(MealSlot.LUNCH, List.of()),
                new com.healthcore.clinical.domain.model.MealSection(MealSlot.DINNER, List.of()),
                new com.healthcore.clinical.domain.model.MealSection(MealSlot.SNACK, List.of())
        );
    }
}
