package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.domain.model.PlanStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoNutritionPlanRepositoryAdapterTest {

    @Mock
    private SpringDataMongoNutritionPlanRepository repository;

    @InjectMocks
    private MongoNutritionPlanRepositoryAdapter adapter;

    @Test
    void shouldMapNutritionPlanToDocumentWhenSaving() {
        NutritionPlan plan = NutritionPlan.rehydrate(
                "plan-1",
                "patient-1",
                AuthorType.NUTRITIONIST,
                "nutri-1",
                PlanStatus.ACTIVE,
                new DailyGoalsSnapshot(2200, 140, 250, 70, 8),
                sections(),
                LocalDateTime.of(2026, 5, 20, 8, 0),
                LocalDateTime.of(2026, 5, 21, 9, 30)
        );

        when(repository.save(any(NutritionPlanDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adapter.save(plan);

        ArgumentCaptor<NutritionPlanDocument> captor = ArgumentCaptor.forClass(NutritionPlanDocument.class);
        verify(repository).save(captor.capture());
        NutritionPlanDocument saved = captor.getValue();

        assertEquals("plan-1", saved.getId());
        assertEquals("patient-1", saved.getPatientId());
        assertEquals("NUTRITIONIST", saved.getAuthorType());
        assertEquals("nutri-1", saved.getAuthorId());
        assertEquals("ACTIVE", saved.getStatus());
        assertEquals(2200, saved.getDailyGoalsSnapshot().getTargetCalories());
        assertEquals(4, saved.getSections().size());
        assertEquals("BREAKFAST", saved.getSections().getFirst().getMealSlot());
        assertEquals("option-breakfast", saved.getSections().getFirst().getOptions().getFirst().getId());
        assertEquals("7501000000001", saved.getSections().getFirst().getOptions().getFirst().getIngredients().getFirst().getBarcode());
    }

    @Test
    void shouldMapActivePlanByPatientAndAuthorTypeFromDocumentToDomain() {
        when(repository.findFirstByPatientIdAndAuthorTypeAndStatusOrderByUpdatedAtDesc(
                "patient-1",
                "SELF_MANAGED",
                "ACTIVE"
        )).thenReturn(Optional.of(planDocument("plan-self", "patient-1", "SELF_MANAGED", "patient-1")));

        Optional<NutritionPlan> result = adapter.findActiveByPatientIdAndAuthorType("patient-1", AuthorType.SELF_MANAGED);

        assertTrue(result.isPresent());
        assertEquals("plan-self", result.get().getId());
        assertEquals(AuthorType.SELF_MANAGED, result.get().getAuthorType());
        assertEquals("patient-1", result.get().getAuthorId());
        assertEquals(4, result.get().getSections().size());
        assertEquals("Breakfast option", result.get().getSections().getFirst().options().getFirst().name());
    }

    @Test
    void shouldMapActivePlanByPatientAuthorTypeAndAuthorId() {
        when(repository.findFirstByPatientIdAndAuthorTypeAndAuthorIdAndStatusOrderByUpdatedAtDesc(
                "patient-1",
                "NUTRITIONIST",
                "nutri-1",
                "ACTIVE"
        )).thenReturn(Optional.of(planDocument("plan-nutri", "patient-1", "NUTRITIONIST", "nutri-1")));

        Optional<NutritionPlan> result = adapter.findActiveByPatientIdAndAuthorTypeAndAuthorId(
                "patient-1",
                AuthorType.NUTRITIONIST,
                "nutri-1"
        );

        assertTrue(result.isPresent());
        assertEquals("plan-nutri", result.get().getId());
        assertEquals("nutri-1", result.get().getAuthorId());
    }

    @Test
    void shouldMapLatestAndActivePlansToDomainLists() {
        when(repository.findFirstByPatientIdAndAuthorTypeOrderByUpdatedAtDesc("patient-1", "NUTRITIONIST"))
                .thenReturn(Optional.of(planDocument("latest-plan", "patient-1", "NUTRITIONIST", "nutri-1")));
        when(repository.findAllByPatientIdAndStatus("patient-1", "ACTIVE"))
                .thenReturn(List.of(
                        planDocument("active-plan-1", "patient-1", "NUTRITIONIST", "nutri-1"),
                        planDocument("active-plan-2", "patient-1", "SELF_MANAGED", "patient-1")
                ));

        Optional<NutritionPlan> latest = adapter.findLatestByPatientIdAndAuthorType("patient-1", AuthorType.NUTRITIONIST);
        List<NutritionPlan> active = adapter.findActiveByPatientId("patient-1");

        assertTrue(latest.isPresent());
        assertEquals("latest-plan", latest.get().getId());
        assertEquals(2, active.size());
        assertEquals(List.of("active-plan-1", "active-plan-2"), active.stream().map(NutritionPlan::getId).toList());
    }

    private List<MealSection> sections() {
        return List.of(
                section(MealSlot.BREAKFAST, "option-breakfast", "7501000000001"),
                section(MealSlot.LUNCH, "option-lunch", "7501000000002"),
                section(MealSlot.DINNER, "option-dinner", "7501000000003"),
                section(MealSlot.SNACK, "option-snack", "7501000000004")
        );
    }

    private MealSection section(MealSlot slot, String optionId, String barcode) {
        return new MealSection(
                slot,
                List.of(new MealOption(
                        optionId,
                        slot.name() + " option".replace('_', ' '),
                        "Serve chilled",
                        "Optional note",
                        List.of(new PlanIngredient(
                                barcode,
                                "Ingredient " + slot.name(),
                                "Brand",
                                "https://cdn.example/" + barcode + ".png",
                                PlanIngredientUnit.GRAMS,
                                100,
                                200,
                                10,
                                20,
                                5
                        )),
                        200,
                        10,
                        20,
                        5
                ))
        );
    }

    private NutritionPlanDocument planDocument(String id, String patientId, String authorType, String authorId) {
        NutritionPlanDocument document = new NutritionPlanDocument();
        document.setId(id);
        document.setPatientId(patientId);
        document.setAuthorType(authorType);
        document.setAuthorId(authorId);
        document.setStatus("ACTIVE");
        document.setCreatedAt(LocalDateTime.of(2026, 5, 20, 8, 0));
        document.setUpdatedAt(LocalDateTime.of(2026, 5, 21, 9, 30));

        DailyGoalsSnapshotDocument goals = new DailyGoalsSnapshotDocument();
        goals.setTargetCalories(2200);
        goals.setTargetProtein(140);
        goals.setTargetCarbs(250);
        goals.setTargetFat(70);
        goals.setTargetWaterGlasses(8);
        document.setDailyGoalsSnapshot(goals);

        document.setSections(List.of(
                sectionDocument(MealSlot.BREAKFAST, "option-breakfast", "Breakfast option", "7501000000001"),
                sectionDocument(MealSlot.LUNCH, "option-lunch", "Lunch option", "7501000000002"),
                sectionDocument(MealSlot.DINNER, "option-dinner", "Dinner option", "7501000000003"),
                sectionDocument(MealSlot.SNACK, "option-snack", "Snack option", "7501000000004")
        ));
        return document;
    }

    private MealSectionDocument sectionDocument(MealSlot slot, String optionId, String optionName, String barcode) {
        MealSectionDocument section = new MealSectionDocument();
        section.setMealSlot(slot.name());

        PlanIngredientDocument ingredient = new PlanIngredientDocument();
        ingredient.setBarcode(barcode);
        ingredient.setName("Ingredient " + slot.name());
        ingredient.setBrand("Brand");
        ingredient.setImageUrl("https://cdn.example/" + barcode + ".png");
        ingredient.setUnit("GRAMS");
        ingredient.setQuantityAmount(100);
        ingredient.setCalories(200);
        ingredient.setProteinGrams(10);
        ingredient.setCarbsGrams(20);
        ingredient.setFatGrams(5);

        MealOptionDocument option = new MealOptionDocument();
        option.setId(optionId);
        option.setName(optionName);
        option.setInstructions("Serve chilled");
        option.setNotes("Optional note");
        option.setIngredients(List.of(ingredient));
        option.setTotalCalories(200);
        option.setTotalProtein(10);
        option.setTotalCarbs(20);
        option.setTotalFat(5);

        section.setOptions(List.of(option));
        return section;
    }
}
