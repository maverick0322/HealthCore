package com.healthcore.clinical.domain.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class NutritionPlan {

    private final String id;
    private final String patientId;
    private final AuthorType authorType;
    private final String authorId;
    private PlanStatus status;
    private DailyGoalsSnapshot dailyGoalsSnapshot;
    private List<MealSection> sections;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private NutritionPlan(
            String id,
            String patientId,
            AuthorType authorType,
            String authorId,
            PlanStatus status,
            DailyGoalsSnapshot dailyGoalsSnapshot,
            List<MealSection> sections,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = requireText(id, "Plan id");
        this.patientId = requireText(patientId, "Patient id");
        this.authorType = requireNonNull(authorType, "Author type");
        this.authorId = requireText(authorId, "Author id");
        this.status = requireNonNull(status, "Plan status");
        this.dailyGoalsSnapshot = requireNonNull(dailyGoalsSnapshot, "Daily goals snapshot");
        this.sections = normalizeSections(sections);
        this.createdAt = requireNonNull(createdAt, "Created at");
        this.updatedAt = requireNonNull(updatedAt, "Updated at");
    }

    public static NutritionPlan createActive(
            String patientId,
            AuthorType authorType,
            String authorId,
            DailyGoalsSnapshot dailyGoalsSnapshot,
            List<MealSection> sections
    ) {
        LocalDateTime now = LocalDateTime.now();
        return new NutritionPlan(
                UUID.randomUUID().toString(),
                patientId,
                authorType,
                authorId,
                PlanStatus.ACTIVE,
                dailyGoalsSnapshot,
                sections,
                now,
                now
        );
    }

    public static NutritionPlan rehydrate(
            String id,
            String patientId,
            AuthorType authorType,
            String authorId,
            PlanStatus status,
            DailyGoalsSnapshot dailyGoalsSnapshot,
            List<MealSection> sections,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        return new NutritionPlan(
                id,
                patientId,
                authorType,
                authorId,
                status,
                dailyGoalsSnapshot,
                sections,
                createdAt,
                updatedAt
        );
    }

    public void update(DailyGoalsSnapshot dailyGoalsSnapshot, List<MealSection> sections) {
        this.dailyGoalsSnapshot = requireNonNull(dailyGoalsSnapshot, "Daily goals snapshot");
        this.sections = normalizeSections(sections);
        this.updatedAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = PlanStatus.ARCHIVED;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return this.status == PlanStatus.ACTIVE;
    }

    private static List<MealSection> normalizeSections(List<MealSection> sections) {
        if (sections == null) {
            throw new IllegalArgumentException("Plan sections are required.");
        }
        if (sections.size() != MealSlot.values().length) {
            throw new IllegalArgumentException("Plan must contain exactly four meal sections.");
        }
        for (MealSlot mealSlot : MealSlot.values()) {
            boolean present = sections.stream().anyMatch(section -> section.mealSlot() == mealSlot);
            if (!present) {
                throw new IllegalArgumentException("Missing plan section for meal slot: " + mealSlot);
            }
        }
        return List.copyOf(sections);
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value.trim();
    }

    private static <T> T requireNonNull(T value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value;
    }

    public String getId() {
        return id;
    }

    public String getPatientId() {
        return patientId;
    }

    public AuthorType getAuthorType() {
        return authorType;
    }

    public String getAuthorId() {
        return authorId;
    }

    public PlanStatus getStatus() {
        return status;
    }

    public DailyGoalsSnapshot getDailyGoalsSnapshot() {
        return dailyGoalsSnapshot;
    }

    public List<MealSection> getSections() {
        return sections;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
