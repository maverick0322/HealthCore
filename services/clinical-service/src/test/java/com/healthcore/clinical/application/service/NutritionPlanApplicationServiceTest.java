package com.healthcore.clinical.application.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

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

@ExtendWith(MockitoExtension.class)
class NutritionPlanApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @Mock
    private NutritionPlanRepositoryPort nutritionPlanRepositoryPort;

    @Mock
    private NutritionCatalogPort nutritionCatalogPort;

    @InjectMocks
    private NutritionPlanApplicationService service;

    @Test
    void shouldSaveSelfManagedPlanEvenWhenMealExceedsDailyGoals() {
        PatientProfile patientProfile = createPatientProfile("patient-1", null);
        NutritionPlanDraft draft = createDraft();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1"
        )).thenReturn(Optional.empty());
        when(nutritionCatalogPort.getFoodByBarcode("food-1")).thenReturn(Optional.of(createCatalogItem()));
        when(nutritionPlanRepositoryPort.save(any(NutritionPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NutritionPlanView view = service.upsertMyNutritionPlan("patient-1", draft);

        assertTrue(view.canEdit());
        assertEquals("SELF_MANAGED", view.mode());
        assertEquals(1, view.sections().get(0).options().size());
        assertTrue(view.sections().get(0).options().get(0).totalCalories() > view.dailyGoals().targetCalories());
    }

    @Test
    void shouldBlockPatientEditionWhenLinkedToNutritionist() {
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-1");
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));

        assertThrows(AccessDeniedException.class, () -> service.upsertMyNutritionPlan("patient-1", createDraft()));
        verify(nutritionPlanRepositoryPort, never()).save(any(NutritionPlan.class));
    }

    @Test
    void shouldPrioritizeNutritionistPlanAndArchiveActiveSelfManagedPlan() {
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-1");
        NutritionPlan selfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1500, 100, 120, 50, 9),
                List.of(
                        new com.healthcore.clinical.domain.model.MealSection(MealSlot.BREAKFAST, List.of()),
                        new com.healthcore.clinical.domain.model.MealSection(MealSlot.LUNCH, List.of()),
                        new com.healthcore.clinical.domain.model.MealSection(MealSlot.DINNER, List.of()),
                        new com.healthcore.clinical.domain.model.MealSection(MealSlot.SNACK, List.of())
                )
        );
        NutritionPlanDraft draft = createDraft();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1"
        )).thenReturn(Optional.of(selfManagedPlan));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1",
                AuthorType.NUTRITIONIST,
                "nutri-1"
        )).thenReturn(Optional.empty());
        when(nutritionPlanRepositoryPort.findLatestByPatientIdAndAuthorType(
                "patient-1",
                AuthorType.SELF_MANAGED
        )).thenReturn(Optional.of(selfManagedPlan));
        when(nutritionCatalogPort.getFoodByBarcode("food-1")).thenReturn(Optional.of(createCatalogItem()));
        when(nutritionPlanRepositoryPort.save(any(NutritionPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NutritionPlanView view = service.upsertNutritionistPatientNutritionPlan("nutri-1", "patient-1", draft);

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

    @Test
    void shouldIgnoreArchivedSelfManagedPlanWhenNoActivePlanExists() {
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-1");
        NutritionPlan archivedSelfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1800, 90, 180, 55, 9),
                emptySections()
        );
        archivedSelfManagedPlan.archive();

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.NUTRITIONIST, "nutri-1"
        )).thenReturn(Optional.empty());
        NutritionPlanView view = service.getNutritionistPatientNutritionPlan("nutri-1", "patient-1");

        assertEquals("NUTRITIONIST", view.mode());
        assertEquals(4, view.sections().size());
        assertTrue(view.sections().stream().allMatch(section -> section.options().isEmpty()));
        assertNull(view.contextSelfManagedPlan());
    }

    @Test
    void shouldAllowNutritionistToEditActiveSelfManagedPlanAsBasePlan() {
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-1");
        NutritionPlan activeSelfManagedPlan = NutritionPlan.createActive(
                "patient-1",
                AuthorType.SELF_MANAGED,
                "patient-1",
                new DailyGoalsSnapshot(1800, 90, 180, 55, 9),
                emptySections()
        );

        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.NUTRITIONIST, "nutri-1"
        )).thenReturn(Optional.empty());
        when(nutritionPlanRepositoryPort.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1", AuthorType.SELF_MANAGED, "patient-1"
        )).thenReturn(Optional.of(activeSelfManagedPlan));

        NutritionPlanView view = service.getNutritionistPatientNutritionPlan("nutri-1", "patient-1");

        assertEquals("NUTRITIONIST", view.mode());
        assertEquals(AuthorType.SELF_MANAGED, view.authorType());
        assertEquals(activeSelfManagedPlan.getSections(), view.sections());
        assertNull(view.contextSelfManagedPlan());
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
