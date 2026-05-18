package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "healthcore_nutrition_plans")
public class NutritionPlanDocument {
    @Id
    private String id;
    private String patientId;
    private String authorType;
    private String authorId;
    private String status;
    private DailyGoalsSnapshotDocument dailyGoalsSnapshot;
    private List<MealSectionDocument> sections;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getAuthorType() {
        return authorType;
    }

    public void setAuthorType(String authorType) {
        this.authorType = authorType;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public DailyGoalsSnapshotDocument getDailyGoalsSnapshot() {
        return dailyGoalsSnapshot;
    }

    public void setDailyGoalsSnapshot(DailyGoalsSnapshotDocument dailyGoalsSnapshot) {
        this.dailyGoalsSnapshot = dailyGoalsSnapshot;
    }

    public List<MealSectionDocument> getSections() {
        return sections;
    }

    public void setSections(List<MealSectionDocument> sections) {
        this.sections = sections;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
