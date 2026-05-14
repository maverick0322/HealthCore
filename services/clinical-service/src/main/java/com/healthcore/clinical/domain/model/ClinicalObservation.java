package com.healthcore.clinical.domain.model;

import java.time.LocalDateTime;

/**
 * Domain entity representing a medical observation or note
 * made by a nutritionist for a specific patient.
 */
public class ClinicalObservation {
    
    private String id;
    private String patientId;
    private String nutritionistId;
    private String note;
    private LocalDateTime createdAt;

    public ClinicalObservation(String id, String patientId, String nutritionistId, String note, LocalDateTime createdAt) {
        this.id = id;
        this.patientId = patientId;
        this.nutritionistId = nutritionistId;
        this.note = note;
        this.createdAt = createdAt;
    }

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

    public String getNutritionistId() {
        return nutritionistId;
    }

    public void setNutritionistId(String nutritionistId) {
        this.nutritionistId = nutritionistId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}