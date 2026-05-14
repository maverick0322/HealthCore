package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "clinical_observations")
public class ClinicalObservationDocument {

    @Id
    private String id;
    private String patientId;
    private String nutritionistId;
    private String note;
    private LocalDateTime createdAt;

    public ClinicalObservationDocument() {}

    public ClinicalObservationDocument(String id, String patientId, String nutritionistId, String note, LocalDateTime createdAt) {
        this.id = id;
        this.patientId = patientId;
        this.nutritionistId = nutritionistId;
        this.note = note;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getNutritionistId() { return nutritionistId; }
    public void setNutritionistId(String nutritionistId) { this.nutritionistId = nutritionistId; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}