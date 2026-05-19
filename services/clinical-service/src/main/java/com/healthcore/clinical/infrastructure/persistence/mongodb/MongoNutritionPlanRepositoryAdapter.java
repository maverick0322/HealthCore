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
import com.healthcore.clinical.domain.port.out.NutritionPlanRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class MongoNutritionPlanRepositoryAdapter implements NutritionPlanRepositoryPort {

    private final SpringDataMongoNutritionPlanRepository repository;

    public MongoNutritionPlanRepositoryAdapter(SpringDataMongoNutritionPlanRepository repository) {
        this.repository = repository;
    }

    @Override
    public NutritionPlan save(NutritionPlan nutritionPlan) {
        repository.save(mapToDocument(nutritionPlan));
        return nutritionPlan;
    }

    @Override
    public Optional<NutritionPlan> findActiveByPatientIdAndAuthorType(String patientId, AuthorType authorType) {
        return repository.findFirstByPatientIdAndAuthorTypeAndStatusOrderByUpdatedAtDesc(
                patientId,
                authorType.name(),
                PlanStatus.ACTIVE.name()
        ).map(this::mapToDomain);
    }

    @Override
    public Optional<NutritionPlan> findActiveByPatientIdAndAuthorTypeAndAuthorId(
            String patientId,
            AuthorType authorType,
            String authorId
    ) {
        return repository.findFirstByPatientIdAndAuthorTypeAndAuthorIdAndStatusOrderByUpdatedAtDesc(
                patientId,
                authorType.name(),
                authorId,
                PlanStatus.ACTIVE.name()
        ).map(this::mapToDomain);
    }

    @Override
    public Optional<NutritionPlan> findLatestByPatientIdAndAuthorType(String patientId, AuthorType authorType) {
        return repository.findFirstByPatientIdAndAuthorTypeOrderByUpdatedAtDesc(
                patientId,
                authorType.name()
        ).map(this::mapToDomain);
    }

    @Override
    public List<NutritionPlan> findActiveByPatientId(String patientId) {
        return repository.findAllByPatientIdAndStatus(patientId, PlanStatus.ACTIVE.name())
                .stream()
                .map(this::mapToDomain)
                .toList();
    }

    private NutritionPlanDocument mapToDocument(NutritionPlan nutritionPlan) {
        NutritionPlanDocument document = new NutritionPlanDocument();
        document.setId(nutritionPlan.getId());
        document.setPatientId(nutritionPlan.getPatientId());
        document.setAuthorType(nutritionPlan.getAuthorType().name());
        document.setAuthorId(nutritionPlan.getAuthorId());
        document.setStatus(nutritionPlan.getStatus().name());
        document.setDailyGoalsSnapshot(mapDailyGoals(nutritionPlan.getDailyGoalsSnapshot()));
        document.setSections(nutritionPlan.getSections().stream().map(this::mapSection).toList());
        document.setCreatedAt(nutritionPlan.getCreatedAt());
        document.setUpdatedAt(nutritionPlan.getUpdatedAt());
        return document;
    }

    private NutritionPlan mapToDomain(NutritionPlanDocument document) {
        return NutritionPlan.rehydrate(
                document.getId(),
                document.getPatientId(),
                AuthorType.valueOf(document.getAuthorType()),
                document.getAuthorId(),
                PlanStatus.valueOf(document.getStatus()),
                mapDailyGoals(document.getDailyGoalsSnapshot()),
                document.getSections().stream().map(this::mapSection).toList(),
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }

    private DailyGoalsSnapshotDocument mapDailyGoals(DailyGoalsSnapshot dailyGoalsSnapshot) {
        DailyGoalsSnapshotDocument document = new DailyGoalsSnapshotDocument();
        document.setTargetCalories(dailyGoalsSnapshot.targetCalories());
        document.setTargetProtein(dailyGoalsSnapshot.targetProtein());
        document.setTargetCarbs(dailyGoalsSnapshot.targetCarbs());
        document.setTargetFat(dailyGoalsSnapshot.targetFat());
        document.setTargetWaterGlasses(dailyGoalsSnapshot.targetWaterGlasses());
        return document;
    }

    private DailyGoalsSnapshot mapDailyGoals(DailyGoalsSnapshotDocument document) {
        return new DailyGoalsSnapshot(
                document.getTargetCalories(),
                document.getTargetProtein(),
                document.getTargetCarbs(),
                document.getTargetFat(),
                document.getTargetWaterGlasses()
        );
    }

    private MealSectionDocument mapSection(MealSection mealSection) {
        MealSectionDocument document = new MealSectionDocument();
        document.setMealSlot(mealSection.mealSlot().name());
        document.setOptions(mealSection.options().stream().map(this::mapOption).toList());
        return document;
    }

    private MealSection mapSection(MealSectionDocument document) {
        return new MealSection(
                MealSlot.valueOf(document.getMealSlot()),
                document.getOptions().stream().map(this::mapOption).toList()
        );
    }

    private MealOptionDocument mapOption(MealOption mealOption) {
        MealOptionDocument document = new MealOptionDocument();
        document.setId(mealOption.id());
        document.setName(mealOption.name());
        document.setInstructions(mealOption.instructions());
        document.setNotes(mealOption.notes());
        document.setIngredients(mealOption.ingredients().stream().map(this::mapIngredient).toList());
        document.setTotalCalories(mealOption.totalCalories());
        document.setTotalProtein(mealOption.totalProtein());
        document.setTotalCarbs(mealOption.totalCarbs());
        document.setTotalFat(mealOption.totalFat());
        return document;
    }

    private MealOption mapOption(MealOptionDocument document) {
        return new MealOption(
                document.getId(),
                document.getName(),
                document.getInstructions(),
                document.getNotes(),
                document.getIngredients().stream().map(this::mapIngredient).toList(),
                document.getTotalCalories(),
                document.getTotalProtein(),
                document.getTotalCarbs(),
                document.getTotalFat()
        );
    }

    private PlanIngredientDocument mapIngredient(PlanIngredient ingredient) {
        PlanIngredientDocument document = new PlanIngredientDocument();
        document.setBarcode(ingredient.barcode());
        document.setName(ingredient.name());
        document.setBrand(ingredient.brand());
        document.setImageUrl(ingredient.imageUrl());
        document.setUnit(ingredient.unit().name());
        document.setQuantityAmount(ingredient.quantityAmount());
        document.setCalories(ingredient.calories());
        document.setProteinGrams(ingredient.proteinGrams());
        document.setCarbsGrams(ingredient.carbsGrams());
        document.setFatGrams(ingredient.fatGrams());
        return document;
    }

    private PlanIngredient mapIngredient(PlanIngredientDocument document) {
        return new PlanIngredient(
                document.getBarcode(),
                document.getName(),
                document.getBrand(),
                document.getImageUrl(),
                PlanIngredientUnit.valueOf(document.getUnit()),
                document.getQuantityAmount(),
                document.getCalories(),
                document.getProteinGrams(),
                document.getCarbsGrams(),
                document.getFatGrams()
        );
    }
}
