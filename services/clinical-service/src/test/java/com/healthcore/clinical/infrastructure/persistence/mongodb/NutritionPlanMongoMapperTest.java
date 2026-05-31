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

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NutritionPlanMongoMapperTest {

    private final NutritionPlanMongoMapper mapper = new NutritionPlanMongoMapper();

    @Test
    void shouldMapNutritionPlanToDocument() {
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

        NutritionPlanDocument document = mapper.toDocument(plan);

        assertEquals("plan-1", document.getId());
        assertEquals("patient-1", document.getPatientId());
        assertEquals("NUTRITIONIST", document.getAuthorType());
        assertEquals("7501000000001", document.getSections().getFirst().getOptions().getFirst().getIngredients().getFirst().getBarcode());
    }

    @Test
    void shouldMapDocumentToNutritionPlan() {
        NutritionPlanDocument document = planDocument("plan-self", "patient-1", "SELF_MANAGED", "patient-1");

        NutritionPlan plan = mapper.toDomain(document);

        assertEquals("plan-self", plan.getId());
        assertEquals(AuthorType.SELF_MANAGED, plan.getAuthorType());
        assertEquals("patient-1", plan.getAuthorId());
        assertEquals(4, plan.getSections().size());
        assertEquals("Breakfast option", plan.getSections().getFirst().options().getFirst().name());
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
                        slot.name().replace('_', ' ') + " option",
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
