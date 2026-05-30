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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionistNutritionPlanApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @Mock
    private NutritionPlanRepositoryPort nutritionPlanRepositoryPort;

    @Mock
    private NutritionCatalogPort nutritionCatalogPort;

    @Test
    void shouldPrioritizeNutritionistPlanAndArchiveActiveSelfManagedPlan() {
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-1");
        NutritionPlan selfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1500, 100, 120, 50, 9),
                emptySections()
        );
        NutritionistNutritionPlanApplicationService service = createService();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.SELF_MANAGED, "patient-1"
        )).thenReturn(Optional.of(selfManagedPlan));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.NUTRITIONIST, "nutri-1"
        )).thenReturn(Optional.empty());
        when(nutritionPlanRepositoryPort.findLatestByPatientIdAndAuthorType(
                "patient-1", AuthorType.SELF_MANAGED
        )).thenReturn(Optional.of(selfManagedPlan));
        when(nutritionCatalogPort.getFoodByBarcode("food-1")).thenReturn(Optional.of(createCatalogItem()));
        when(nutritionPlanRepositoryPort.save(any(NutritionPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NutritionPlanView view = service.upsertNutritionistPatientNutritionPlan("nutri-1", "patient-1", createDraft());

        assertEquals(AuthorType.NUTRITIONIST, view.authorType());
        assertNotNull(view.contextSelfManagedPlan());
        assertFalse(selfManagedPlan.isActive());
        verify(nutritionPlanRepositoryPort, times(2)).save(any(NutritionPlan.class));
    }

    @Test
    void shouldArchivePlansAfterUnlink() {
        NutritionPlan nutritionistPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.NUTRITIONIST,
                "nutri-1",
                new DailyGoalsSnapshot(2000, 100, 200, 60, 10),
                emptySections()
        );
        NutritionPlan selfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1800, 90, 180, 55, 9),
                emptySections()
        );
        NutritionistNutritionPlanApplicationService service = createService();

        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.NUTRITIONIST, "nutri-1"
        )).thenReturn(Optional.of(nutritionistPlan));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.SELF_MANAGED, "patient-1"
        )).thenReturn(Optional.of(selfManagedPlan));
        when(nutritionPlanRepositoryPort.save(any(NutritionPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.archivePlansAfterUnlink("patient-1", "nutri-1");

        assertFalse(nutritionistPlan.isActive());
        assertFalse(selfManagedPlan.isActive());
        verify(nutritionPlanRepositoryPort, times(2)).save(any(NutritionPlan.class));
    }

    private NutritionistNutritionPlanApplicationService createService() {
        NutritionPlanProfileContextService contextService = new NutritionPlanProfileContextService(clinicalRepositoryPort);
        NutritionPlanDraftCalculator draftCalculator = new NutritionPlanDraftCalculator(nutritionCatalogPort);
        return new NutritionistNutritionPlanApplicationService(contextService, nutritionPlanRepositoryPort, draftCalculator);
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
