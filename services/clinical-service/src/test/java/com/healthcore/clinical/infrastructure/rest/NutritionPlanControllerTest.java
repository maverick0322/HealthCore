package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.MealOption;
import com.healthcore.clinical.domain.model.MealSection;
import com.healthcore.clinical.domain.model.MealSlot;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.NutritionPlanView;
import com.healthcore.clinical.domain.model.PlanIngredient;
import com.healthcore.clinical.domain.model.PlanIngredientUnit;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NutritionPlanController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class NutritionPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ManageNutritionPlanUseCase manageNutritionPlanUseCase;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldReturnPatientNutritionPlan() throws Exception {
        when(manageNutritionPlanUseCase.getMyNutritionPlan("patient-123")).thenReturn(createView(false, null));

        mockMvc.perform(get("/api/v1/clinical/nutrition-plan/me").header("X-User-Id", "patient-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("SELF_MANAGED"))
                .andExpect(jsonPath("$.dailyGoals.targetWaterGlasses").value(10))
                .andExpect(jsonPath("$.sections[0].mealSlot").value("BREAKFAST"));
    }

    @Test
    void shouldUpsertPatientNutritionPlan() throws Exception {
        when(manageNutritionPlanUseCase.upsertMyNutritionPlan(eq("patient-123"), any())).thenReturn(createView(false, null));

        mockMvc.perform(put("/api/v1/clinical/nutrition-plan/me")
                        .header("X-User-Id", "patient-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequestBody())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canEdit").value(true))
                .andExpect(jsonPath("$.sections[0].options[0].name").value("Avena"));
    }

    @Test
    void shouldReturnNutritionistPatientPlanWithContext() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(manageNutritionPlanUseCase.getNutritionistPatientNutritionPlan("nutri-123", "patient-123"))
                .thenReturn(createView(true, createContextPlan()));

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients/{patientId}/nutrition-plan", "patient-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("NUTRITIONIST"))
                .andExpect(jsonPath("$.contextSelfManagedPlan.authorType").value("SELF_MANAGED"));
    }

    @Test
    void shouldSearchCatalogFoods() throws Exception {
        when(manageNutritionPlanUseCase.searchCatalogFoods("oat")).thenReturn(List.of(
                new CatalogFoodItem("food-1", "Oats", "Brand", "", 100, 10, 20, 5)
        ));

        mockMvc.perform(get("/api/v1/clinical/catalog/foods/search").param("query", "oat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].barcode").value("food-1"))
                .andExpect(jsonPath("$[0].caloriesPer100Units").value(100.0));
    }

    private void setSecurityContext(String userId, String... roles) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Stream.of(roles)
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                .collect(Collectors.toList())
                )
        );
    }

    private NutritionPlanView createView(boolean nutritionistMode, NutritionPlan contextPlan) {
        DailyGoalsSnapshot dailyGoalsSnapshot = new DailyGoalsSnapshot(2000, 120, 180, 60, 10);
        PlanIngredient ingredient = new PlanIngredient("food-1", "Oats", "Brand", "", PlanIngredientUnit.GRAMS, 100, 300, 15, 40, 10);
        MealOption breakfast = new MealOption("meal-1", "Avena", "Cocinar", "Pera si no hay manzana", List.of(ingredient), 300, 15, 40, 10);
        List<MealSection> sections = List.of(
                new MealSection(MealSlot.BREAKFAST, List.of(breakfast)),
                new MealSection(MealSlot.LUNCH, List.of()),
                new MealSection(MealSlot.DINNER, List.of()),
                new MealSection(MealSlot.SNACK, List.of())
        );

        return new NutritionPlanView(
                nutritionistMode ? "NUTRITIONIST" : "SELF_MANAGED",
                nutritionistMode ? AuthorType.NUTRITIONIST : AuthorType.SELF_MANAGED,
                !nutritionistMode,
                dailyGoalsSnapshot,
                sections,
                contextPlan
        );
    }

    private NutritionPlan createContextPlan() {
        return NutritionPlan.rehydrate(
                "context-1",
                "patient-123",
                AuthorType.SELF_MANAGED,
                "patient-123",
                com.healthcore.clinical.domain.model.PlanStatus.ARCHIVED,
                new DailyGoalsSnapshot(1800, 100, 160, 55, 9),
                List.of(
                        new MealSection(MealSlot.BREAKFAST, List.of()),
                        new MealSection(MealSlot.LUNCH, List.of()),
                        new MealSection(MealSlot.DINNER, List.of()),
                        new MealSection(MealSlot.SNACK, List.of())
                ),
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().minusDays(1)
        );
    }

    private Object createRequestBody() {
        return new Object() {
            public final List<Object> sections = List.of(
                    new Object() {
                        public final String mealSlot = "BREAKFAST";
                        public final List<Object> options = List.of(
                                new Object() {
                                    public final String name = "Avena";
                                    public final String instructions = "Cocinar";
                                    public final String notes = "Notas";
                                    public final List<Object> ingredients = List.of(
                                            new Object() {
                                                public final String barcode = "food-1";
                                                public final String unit = "GRAMS";
                                                public final Double quantityAmount = 100.0;
                                            }
                                    );
                                }
                        );
                    },
                    new Object() {
                        public final String mealSlot = "LUNCH";
                        public final List<Object> options = List.of();
                    },
                    new Object() {
                        public final String mealSlot = "DINNER";
                        public final List<Object> options = List.of();
                    },
                    new Object() {
                        public final String mealSlot = "SNACK";
                        public final List<Object> options = List.of();
                    }
            );
        };
    }
}
