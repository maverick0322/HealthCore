package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;

public class PatientProfileResponse {
    private String userId;
    private Double weightKg;
    private Double heightCm;
    private LocalDate birthDate;
    private String gender;
    private String activityLevel;
    private String nutritionistId;

    public PatientProfileResponse(String userId, Double weightKg, Double heightCm, LocalDate birthDate, String gender, String activityLevel, String nutritionistId) {
        this.userId = userId;
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.birthDate = birthDate;
        this.gender = gender;
        this.activityLevel = activityLevel;
        this.nutritionistId = nutritionistId;
    }

    // Getters
    public String getUserId() { return userId; }
    public Double getWeightKg() { return weightKg; }
    public Double getHeightCm() { return heightCm; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getGender() { return gender; }
    public String getActivityLevel() { return activityLevel; }
    public String getNutritionistId() { return nutritionistId; }
}