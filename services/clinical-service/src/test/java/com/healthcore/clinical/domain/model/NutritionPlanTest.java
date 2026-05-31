package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NutritionPlanTest {

    @Test
    void shouldCreateActiveNutritionPlanWithCopiedSections() {
        List<MealSection> sections = new ArrayList<>(createSections("Inicial"));

        NutritionPlan plan = NutritionPlan.createActive(
                "patient-123",
                AuthorType.SELF_MANAGED,
                "patient-123",
                new DailyGoalsSnapshot(2000, 120, 220, 60, 8),
                sections
        );
        sections.add(createSection(MealSlot.BREAKFAST, "Extra"));

        assertNotNull(plan.getId());
        assertEquals("patient-123", plan.getPatientId());
        assertEquals(AuthorType.SELF_MANAGED, plan.getAuthorType());
        assertEquals(PlanStatus.ACTIVE, plan.getStatus());
        assertTrue(plan.isActive());
        assertEquals(4, plan.getSections().size());
        assertNotNull(plan.getCreatedAt());
        assertNotNull(plan.getUpdatedAt());
    }

    @Test
    void shouldUpdateNutritionPlanSectionsAndGoals() throws Exception {
        NutritionPlan plan = NutritionPlan.rehydrate(
                "plan-1",
                "patient-123",
                AuthorType.NUTRITIONIST,
                "nutri-123",
                PlanStatus.ACTIVE,
                new DailyGoalsSnapshot(1800, 110, 180, 55, 8),
                createSections("Inicial"),
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().minusDays(1)
        );
        LocalDateTime previousUpdatedAt = plan.getUpdatedAt();

        Thread.sleep(5);
        plan.update(
                new DailyGoalsSnapshot(2100, 130, 220, 70, 9),
                createSections("Actualizado")
        );

        assertEquals(2100, plan.getDailyGoalsSnapshot().targetCalories());
        assertEquals("Actualizado BREAKFAST", plan.getSections().get(0).options().get(0).name());
        assertTrue(plan.getUpdatedAt().isAfter(previousUpdatedAt));
    }

    @Test
    void shouldArchiveNutritionPlan() throws Exception {
        NutritionPlan plan = NutritionPlan.rehydrate(
                "plan-1",
                "patient-123",
                AuthorType.NUTRITIONIST,
                "nutri-123",
                PlanStatus.ACTIVE,
                new DailyGoalsSnapshot(1800, 110, 180, 55, 8),
                createSections("Inicial"),
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().minusDays(1)
        );
        LocalDateTime previousUpdatedAt = plan.getUpdatedAt();

        Thread.sleep(5);
        plan.archive();

        assertEquals(PlanStatus.ARCHIVED, plan.getStatus());
        assertTrue(plan.getUpdatedAt().isAfter(previousUpdatedAt));
        assertTrue(!plan.isActive());
    }

    @Test
    void shouldRejectNutritionPlanWithoutExactSectionCount() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> NutritionPlan.createActive(
                        "patient-123",
                        AuthorType.SELF_MANAGED,
                        "patient-123",
                        new DailyGoalsSnapshot(2000, 120, 220, 60, 8),
                        List.of(
                                createSection(MealSlot.BREAKFAST, "Desayuno"),
                                createSection(MealSlot.LUNCH, "Comida"),
                                createSection(MealSlot.DINNER, "Cena")
                        )
                )
        );

        assertEquals("Plan must contain exactly four meal sections.", exception.getMessage());
    }

    @Test
    void shouldRejectNutritionPlanWhenAnyMealSlotIsMissing() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> NutritionPlan.createActive(
                        "patient-123",
                        AuthorType.SELF_MANAGED,
                        "patient-123",
                        new DailyGoalsSnapshot(2000, 120, 220, 60, 8),
                        List.of(
                                createSection(MealSlot.BREAKFAST, "Desayuno"),
                                createSection(MealSlot.BREAKFAST, "Desayuno 2"),
                                createSection(MealSlot.LUNCH, "Comida"),
                                createSection(MealSlot.DINNER, "Cena")
                        )
                )
        );

        assertEquals("Missing plan section for meal slot: SNACK", exception.getMessage());
    }

    private List<MealSection> createSections(String prefix) {
        return List.of(
                createSection(MealSlot.BREAKFAST, prefix + " BREAKFAST"),
                createSection(MealSlot.LUNCH, prefix + " LUNCH"),
                createSection(MealSlot.DINNER, prefix + " DINNER"),
                createSection(MealSlot.SNACK, prefix + " SNACK")
        );
    }

    private MealSection createSection(MealSlot mealSlot, String mealName) {
        return new MealSection(
                mealSlot,
                List.of(new MealOption(
                        mealSlot.name().toLowerCase(),
                        mealName,
                        "",
                        "",
                        List.of(new PlanIngredient(
                                "7501234567890",
                                "Avena",
                                "Marca",
                                null,
                                PlanIngredientUnit.GRAMS,
                                100.0,
                                380,
                                12,
                                60,
                                7
                        )),
                        380,
                        18,
                        52,
                        9
                ))
        );
    }
}
